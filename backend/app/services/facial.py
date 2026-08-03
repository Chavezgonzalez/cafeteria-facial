import re
import shutil
import unicodedata
from pathlib import Path
from uuid import uuid4

from deepface import DeepFace
from fastapi import UploadFile

from app.config import DATASET_DIR, TEMP_DIR


ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png"
}


def normalize_folder_name(name: str) -> str:
    normalized = unicodedata.normalize(
        "NFKD",
        name.strip()
    )

    without_accents = "".join(
        character
        for character in normalized
        if not unicodedata.combining(character)
    )

    safe_name = re.sub(
        r"[^a-zA-Z0-9_-]+",
        "_",
        without_accents
    )

    safe_name = safe_name.strip("_").lower()

    if not safe_name:
        raise ValueError(
            "El nombre del usuario no es válido"
        )

    return safe_name


def validate_image_extension(
    filename: str | None
) -> str:
    if not filename:
        return ".jpg"

    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError(
            "Solo se permiten imágenes JPG, JPEG o PNG"
        )

    return extension


async def save_upload_file(
    upload_file: UploadFile,
    destination: Path
) -> None:
    destination.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with destination.open("wb") as output_file:
        while chunk := await upload_file.read(
            1024 * 1024
        ):
            output_file.write(chunk)

    await upload_file.close()


def image_contains_face(
    image_path: Path
) -> bool:
    try:
        faces = DeepFace.extract_faces(
            img_path=str(image_path),
            detector_backend="opencv",
            enforce_detection=True,
            align=True
        )

        print(
            f"[OK] {image_path.name}: "
            f"{len(faces)} rostro(s) detectado(s)"
        )

        return len(faces) == 1

    except Exception as error:
        print(
            f"[RECHAZADA] {image_path.name}: {error}"
        )

        return False


async def save_user_dataset(
    user_name: str,
    files: list[UploadFile]
) -> tuple[str, int, int]:
    folder_name = normalize_folder_name(
        user_name
    )

    final_folder = DATASET_DIR / folder_name

    temporary_folder = (
        TEMP_DIR
        / f"dataset_{folder_name}_{uuid4().hex}"
    )

    temporary_folder.mkdir(
        parents=True,
        exist_ok=True
    )

    valid_images = 0
    rejected_images = 0

    try:
        for index, upload_file in enumerate(
            files,
            start=1
        ):
            extension = validate_image_extension(
                upload_file.filename
            )

            temporary_image = (
                temporary_folder
                / f"image_{index:03d}{extension}"
            )

            await save_upload_file(
                upload_file,
                temporary_image
            )

            if image_contains_face(
                temporary_image
            ):
                valid_images += 1

                valid_destination = (
                    temporary_folder
                    / f"face_{valid_images:03d}.jpg"
                )

                if temporary_image != valid_destination:
                    temporary_image.rename(
                        valid_destination
                    )

            else:
                rejected_images += 1
                temporary_image.unlink(
                    missing_ok=True
                )

        if valid_images < 5:
            raise ValueError(
                "Se necesitan al menos 5 imágenes "
                "válidas con un rostro. "
                f"Válidas: {valid_images}. "
                f"Rechazadas: {rejected_images}."
            )

        if final_folder.exists():
            shutil.rmtree(final_folder)

        shutil.move(
            str(temporary_folder),
            str(final_folder)
        )

        return (
            folder_name,
            valid_images,
            rejected_images
        )

    except Exception:
        if temporary_folder.exists():
            shutil.rmtree(
                temporary_folder,
                ignore_errors=True
            )

        raise


async def recognize_uploaded_face(
    upload_file: UploadFile
) -> tuple[str, float, str]:
    """
    Guarda temporalmente una selfie y busca su rostro
    dentro del dataset.

    Retorna:
    - nombre de la carpeta reconocida
    - distancia facial
    - imagen del dataset con mayor coincidencia
    """

    if not DATASET_DIR.exists():
        raise ValueError(
            "El dataset facial no existe"
        )

    user_folders = [
        folder
        for folder in DATASET_DIR.iterdir()
        if folder.is_dir()
    ]

    if not user_folders:
        raise ValueError(
            "No hay usuarios con dataset facial"
        )

    extension = validate_image_extension(
        upload_file.filename
    )

    temporary_image = (
        TEMP_DIR
        / f"login_{uuid4().hex}{extension}"
    )

    await save_upload_file(
        upload_file,
        temporary_image
    )

    try:
        if not image_contains_face(
            temporary_image
        ):
            raise ValueError(
                "No se detectó exactamente un rostro "
                "en la fotografía"
            )

        results = DeepFace.find(
            img_path=str(temporary_image),
            db_path=str(DATASET_DIR),
            model_name="Facenet512",
            detector_backend="opencv",
            distance_metric="cosine",
            enforce_detection=True,
            align=True,
            silent=True
        )

        valid_results = [
            dataframe
            for dataframe in results
            if dataframe is not None
            and not dataframe.empty
        ]

        if not valid_results:
            raise ValueError(
                "Rostro no reconocido"
            )

        matches = valid_results[0].sort_values(
            by="distance",
            ascending=True
        )

        best_match = matches.iloc[0]

        identity_path = Path(
            str(best_match["identity"])
        )

        distance = float(
            best_match["distance"]
        )

        if "threshold" in matches.columns:
            threshold = float(
                best_match["threshold"]
            )

            if distance > threshold:
                raise ValueError(
                    "Rostro no reconocido"
                )

        folder_name = identity_path.parent.name

        return (
            folder_name,
            distance,
            str(identity_path)
        )

    finally:
        temporary_image.unlink(
            missing_ok=True
        )