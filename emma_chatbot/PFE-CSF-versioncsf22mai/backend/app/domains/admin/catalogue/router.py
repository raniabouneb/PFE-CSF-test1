from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from app.core.auth_deps import StaffUser, require_staff_write
from app.persistence.models import User
from app.core.dependencies import Db
from app.domains.admin.catalogue import schemas as sch
from app.domains.admin.catalogue.service import (
    create_module,
    delete_module,
    delete_support,
    get_filters_and_kpis,
    list_modules_page,
    parse_module_ref,
    patch_module,
    upload_support_pdf,
)
from app.domains.catalog.ponctuelle_formations import get_ponctuelle_formation_by_slug

router = APIRouter()

CatalogueWriteUser = Annotated[User, Depends(require_staff_write("catalogue"))]


@router.get("/filters", response_model=sch.CatalogueFiltersResponse)
def catalogue_filters(_staff: StaffUser, db: Db) -> sch.CatalogueFiltersResponse:
    data = get_filters_and_kpis(db)
    return sch.CatalogueFiltersResponse.model_validate(data)


@router.get("/modules", response_model=sch.CatalogueModuleListResponse)
def catalogue_modules_list(
    _staff: StaffUser,
    db: Db,
    format: str | None = Query(None, description="all | reconversion | ponctuelle | sur_mesure"),
    segment: str | None = Query(None, description="Slug parcours reconversion ou formation ponctuelle"),
    reconversionPackId: str | None = Query(None, description="ID du pack reconversion"),
    search: str | None = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
) -> sch.CatalogueModuleListResponse:
    items_raw, total = list_modules_page(
        db,
        format_filter=format or "all",
        segment_slug=segment,
        reconversion_pack_id=reconversionPackId,
        search=search,
        page=page,
        page_size=pageSize,
    )
    items = [sch.CatalogueModuleRow.model_validate(x) for x in items_raw]
    return sch.CatalogueModuleListResponse(
        items=items, total=total, page=page, pageSize=pageSize
    )


@router.post("/modules", response_model=sch.CatalogueModuleCreateResponse)
def catalogue_modules_create(
    _staff: CatalogueWriteUser,
    db: Db,
    body: sch.CatalogueModuleCreateBody,
) -> sch.CatalogueModuleCreateResponse:
    row = create_module(db, body)
    return sch.CatalogueModuleCreateResponse(module=sch.CatalogueModuleRow.model_validate(row))


@router.patch("/modules/{module_id}", response_model=sch.CatalogueModuleMutationResponse)
def catalogue_modules_patch(
    _staff: CatalogueWriteUser,
    db: Db,
    module_id: str,
    body: sch.CatalogueModulePatchBody,
) -> sch.CatalogueModuleMutationResponse:
    src, pk = parse_module_ref(module_id)
    row = patch_module(db, src, pk, body)
    return sch.CatalogueModuleMutationResponse(module=sch.CatalogueModuleRow.model_validate(row))


@router.delete("/modules/{module_id}", response_model=sch.CatalogueDeleteResponse)
def catalogue_modules_delete(_staff: CatalogueWriteUser, db: Db, module_id: str) -> sch.CatalogueDeleteResponse:
    src, pk = parse_module_ref(module_id)
    delete_module(db, src, pk)
    return sch.CatalogueDeleteResponse()


@router.post(
    "/modules/{module_id}/supports",
    response_model=sch.SupportUploadResponse,
)
async def catalogue_module_support_upload(
    _staff: CatalogueWriteUser,
    db: Db,
    module_id: str,
    file: UploadFile = File(...),
) -> sch.SupportUploadResponse:
    src, pk = parse_module_ref(module_id)
    sup = await upload_support_pdf(db, src, pk, file)
    return sch.SupportUploadResponse(support=sch.SupportItem.model_validate(sup))


@router.delete(
    "/modules/{module_id}/supports/{support_id}",
    response_model=sch.SupportDeleteResponse,
)
def catalogue_module_support_delete(
    _staff: CatalogueWriteUser,
    db: Db,
    module_id: str,
    support_id: int,
) -> sch.SupportDeleteResponse:
    src, pk = parse_module_ref(module_id)
    delete_support(db, src, pk, support_id)
    return sch.SupportDeleteResponse()


@router.get("/ponctuelle-modules/{slug}")
def catalogue_ponctuelle_modules(
    _staff: StaffUser,
    db: Db,
    slug: str,
) -> dict:
    data = get_ponctuelle_formation_by_slug(db, slug)
    if data is None:
        raise HTTPException(status_code=404, detail="Formation ponctuelle introuvable.")
    return data
