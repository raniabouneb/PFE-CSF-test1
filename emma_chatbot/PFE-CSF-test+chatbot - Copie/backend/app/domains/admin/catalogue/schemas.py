from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

ModuleFormat = Literal["reconversion", "ponctuelle", "sur_mesure"]
ModuleSource = Literal["reconversion_pack_module", "ponctuelle_module", "sur_mesure_module"]


class FilterOption(BaseModel):
    id: str
    label: str


class CatalogueKpis(BaseModel):
    modules: int
    supports: int
    totalHours: int


class CatalogueFiltersResponse(BaseModel):
    formats: list[FilterOption]
    reconversionTopics: list[FilterOption]
    reconversionPacks: list[dict[str, str]]
    ponctuelleFormations: list[FilterOption]
    kpis: CatalogueKpis


class SupportItem(BaseModel):
    id: str
    fileName: str
    url: str


class CatalogueModuleRow(BaseModel):
    id: str
    displayCode: str
    titre: str
    description: str
    imageUrl: str | None = None
    format: ModuleFormat
    segmentSlug: str | None = None
    segmentLabel: str | None = None
    reconversionPackId: str | None = None
    reconversionPackLabel: str | None = None
    dureeHeures: int
    nombreLabs: int
    examen: bool
    durationText: str | None = None
    practiceText: str | None = None
    projectText: str | None = None
    evaluationText: str | None = None
    supportsPdf: list[SupportItem] = Field(default_factory=list)


class CatalogueModuleListResponse(BaseModel):
    items: list[CatalogueModuleRow]
    total: int
    page: int
    pageSize: int


class CatalogueModuleCreateBody(BaseModel):
    titre: str = Field(..., min_length=1, max_length=500)
    description: str = Field("", max_length=20000)
    format: ModuleFormat
    """Slug `reconversion_topic` si format=reconversion."""
    reconversionTopicSlug: str | None = None
    """Identifiant numérique `reconversion_pack.id` (prioritaire si fourni)."""
    reconversionPackId: str | None = None
    """Slug `ponctuelle_formation` si format=ponctuelle."""
    ponctuelleFormationSlug: str | None = None
    dureeHeures: int = Field(24, ge=1, le=2000)
    nombreLabs: int = Field(0, ge=0, le=500)
    examen: bool = True
    durationText: str | None = Field(None, max_length=300)
    practiceText: str | None = Field(None, max_length=2000)
    projectText: str | None = Field(None, max_length=2000)
    evaluationText: str | None = Field(None, max_length=2000)
    imageUrl: str | None = Field(None, max_length=2000)


class CatalogueModulePatchBody(BaseModel):
    titre: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = Field(None, max_length=20000)
    reconversionTopicSlug: str | None = None
    reconversionPackId: str | None = None
    ponctuelleFormationSlug: str | None = None
    dureeHeures: int | None = Field(None, ge=1, le=2000)
    nombreLabs: int | None = Field(None, ge=0, le=500)
    examen: bool | None = None
    durationText: str | None = Field(None, max_length=300)
    practiceText: str | None = Field(None, max_length=2000)
    projectText: str | None = Field(None, max_length=2000)
    evaluationText: str | None = Field(None, max_length=2000)
    imageUrl: str | None = Field(None, max_length=2000)


class CatalogueModuleCreateResponse(BaseModel):
    module: CatalogueModuleRow


class CatalogueModuleMutationResponse(BaseModel):
    module: CatalogueModuleRow


class CatalogueDeleteResponse(BaseModel):
    ok: bool = True


class SupportUploadResponse(BaseModel):
    support: SupportItem


class SupportDeleteResponse(BaseModel):
    ok: bool = True
