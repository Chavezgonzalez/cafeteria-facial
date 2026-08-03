from typing import Annotated, List

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.services.facial import (
    normalize_folder_name,
    recognize_uploaded_face,
    save_user_dataset
)

router = APIRouter(
    tags=["Authentication"]
)


@router.post(
    "/upload-dataset/",
    status_code=status.HTTP_201_CREATED
)
async def upload_dataset(
    user_name: Annotated[str, Form(...)],
    files: Annotated[List[UploadFile], File(...)],
    db: Session = Depends(get_db)
):
    clean_name = user_name.strip()

    if len(clean_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El nombre debe tener al menos 2 caracteres"
        )

    if len(files) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes enviar al menos 5 imágenes"
        )

    if len(files) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes enviar más de 50 imágenes"
        )

    try:
        folder_name = normalize_folder_name(
            clean_name
        )

        existing_user = db.scalar(
            select(User).where(
                User.face_folder == folder_name
            )
        )

        saved_folder, valid_images, rejected_images = (
            await save_user_dataset(
                user_name=clean_name,
                files=files
            )
        )

        if existing_user:
            existing_user.name = clean_name
            existing_user.face_folder = saved_folder
            existing_user.active = True
            user = existing_user

        else:
            generated_email = (
                f"{saved_folder}@facial.local"
            )

            email_user = db.scalar(
                select(User).where(
                    User.email == generated_email
                )
            )

            if email_user:
                email_user.name = clean_name
                email_user.face_folder = saved_folder
                email_user.active = True
                user = email_user

            else:
                user = User(
                    name=clean_name,
                    email=generated_email,
                    role="customer",
                    face_folder=saved_folder,
                    active=True
                )

                db.add(user)

        db.commit()
        db.refresh(user)

        return {
            "message": "Dataset facial guardado correctamente",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "face_folder": user.face_folder
            },
            "valid_images": valid_images,
            "rejected_images": rejected_images
        }

    except ValueError as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        )

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "No se pudo guardar el dataset facial: "
                f"{str(error)}"
            )
        )


@router.post("/auth/login-face")
async def login_face(
    file: Annotated[UploadFile, File(...)],
    db: Session = Depends(get_db)
):
    try:
        folder_name, distance, matched_image = (
            await recognize_uploaded_face(file)
        )

        user = db.scalar(
            select(User).where(
                User.face_folder == folder_name
            )
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "El rostro fue reconocido, pero no existe "
                    "un usuario asociado"
                )
            )

        if not user.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El usuario está desactivado"
            )

        confidence = max(
            0.0,
            min(100.0, (1.0 - distance) * 100)
        )

        return {
            "message": "Rostro reconocido correctamente",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "balance": user.balance,
                "face_folder": user.face_folder
            },
            "recognition": {
                "distance": round(distance, 4),
                "estimated_confidence": round(
                    confidence,
                    2
                ),
                "matched_image": matched_image
            }
        }

    except HTTPException:
        raise

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error)
        )

    except Exception as error:
        print(
            f"[ERROR LOGIN FACIAL] {error}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "No se pudo procesar el reconocimiento facial: "
                f"{str(error)}"
            )
        )