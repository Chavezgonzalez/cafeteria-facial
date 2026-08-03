from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Order, OrderItem, Product, User
from app.schemas import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate
)

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

VALID_STATUSES = {
    "pending",
    "preparing",
    "ready",
    "completed",
    "cancelled"
}


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED
)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db)
):
    user = db.get(User, order_data.user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario está desactivado"
        )

    product_quantities: dict[int, int] = {}

    for item in order_data.items:
        product_quantities[item.product_id] = (
            product_quantities.get(item.product_id, 0)
            + item.quantity
        )

    products: dict[int, Product] = {}
    total = 0.0

    for product_id, quantity in product_quantities.items():
        product = db.get(Product, product_id)

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto {product_id} no encontrado"
            )

        if not product.active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El producto {product.name} está desactivado"
            )

        if product.stock < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Stock insuficiente para {product.name}. "
                    f"Disponible: {product.stock}"
                )
            )

        products[product_id] = product
        total += product.price * quantity

    new_order = Order(
        user_id=user.id,
        total=round(total, 2),
        status="pending"
    )

    db.add(new_order)
    db.flush()

    for product_id, quantity in product_quantities.items():
        product = products[product_id]
        subtotal = product.price * quantity

        order_item = OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=product.price,
            subtotal=round(subtotal, 2)
        )

        product.stock -= quantity
        db.add(order_item)

    try:
        db.commit()
    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear la orden"
        )

    created_order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == new_order.id)
    )

    return created_order


@router.get(
    "/",
    response_model=list[OrderResponse]
)
def list_orders(
    order_status: str | None = None,
    db: Session = Depends(get_db)
):
    query = (
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.id.desc())
    )

    if order_status is not None:
        query = query.where(
            Order.status == order_status
        )

    return db.scalars(query).all()


@router.get(
    "/user/{user_id}",
    response_model=list[OrderResponse]
)
def list_user_orders(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    query = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == user_id)
        .order_by(Order.id.desc())
    )

    return db.scalars(query).all()


@router.get(
    "/{order_id}",
    response_model=OrderResponse
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada"
        )

    return order


@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse
)
def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    new_status = status_data.status.lower().strip()

    if new_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Estado inválido. Usa: pending, preparing, "
                "ready, completed o cancelled"
            )
        )

    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Orden no encontrada"
        )

    if order.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La orden ya está cancelada"
        )

    if new_status == "cancelled" and order.status != "cancelled":
        for item in order.items:
            product = db.get(Product, item.product_id)

            if product is not None:
                product.stock += item.quantity

    order.status = new_status

    db.commit()
    db.refresh(order)

    return order