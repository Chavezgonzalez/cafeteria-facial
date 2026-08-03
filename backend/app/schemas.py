from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    role: str = Field(
        default="customer",
        max_length=30
    )


class UserUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    email: EmailStr | None = None

    role: str | None = Field(
        default=None,
        max_length=30
    )

    balance: float | None = Field(
        default=None,
        ge=0
    )

    active: bool | None = None


class UserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str
    email: EmailStr
    role: str
    balance: float
    face_folder: str | None
    active: bool
    created_at: datetime


class CategoryCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    description: str | None = Field(
        default=None,
        max_length=255
    )


class CategoryUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    description: str | None = Field(
        default=None,
        max_length=255
    )

    active: bool | None = None


class CategoryResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str
    description: str | None
    active: bool
    created_at: datetime


class ProductCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=120
    )

    description: str | None = Field(
        default=None,
        max_length=255
    )

    price: float = Field(gt=0)

    stock: int = Field(
        default=0,
        ge=0
    )

    image_url: str | None = Field(
        default=None,
        max_length=255
    )

    category_id: int = Field(gt=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120
    )

    description: str | None = Field(
        default=None,
        max_length=255
    )

    price: float | None = Field(
        default=None,
        gt=0
    )

    stock: int | None = Field(
        default=None,
        ge=0
    )

    image_url: str | None = Field(
        default=None,
        max_length=255
    )

    category_id: int | None = Field(
        default=None,
        gt=0
    )

    active: bool | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    name: str
    description: str | None
    price: float
    stock: int
    image_url: str | None
    active: bool
    category_id: int
    created_at: datetime


class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)

    quantity: int = Field(
        gt=0
    )


class OrderCreate(BaseModel):
    user_id: int = Field(gt=0)

    items: list[OrderItemCreate] = Field(
        min_length=1
    )


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float


class OrderResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    user_id: int
    total: float
    status: str
    created_at: datetime
    items: list[OrderItemResponse]


class OrderStatusUpdate(BaseModel):
    status: str = Field(
        min_length=3,
        max_length=30
    )