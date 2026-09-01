-- B2 phase 1: the domain model, additive. Nothing reads these tables yet and
-- Node's two new columns are nullable, so applying this is a no-op for the
-- running site. Rollback: DROP the eleven tables and six types, and the two
-- Node columns.

-- CreateEnum
CREATE TYPE "OrganizationKind" AS ENUM ('OWNER', 'OPERATOR', 'REGULATOR', 'UTILITY');
CREATE TYPE "FuelKind" AS ENUM ('GAS', 'COAL', 'HSD', 'HFO', 'HYDRO', 'SOLAR', 'WIND', 'NUCLEAR', 'IMPORT');
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'CONSTRUCTION', 'COMMISSIONED', 'CANCELLED');
CREATE TYPE "ContractKind" AS ENUM ('PPA', 'TARIFF', 'SUPPLY');
CREATE TYPE "Publisher" AS ENUM ('PGCB', 'PETROBANGLA', 'SREDA', 'BPDB');
CREATE TYPE "ObservationBasis" AS ENUM ('REPORTED', 'DERIVED');

-- AlterTable
ALTER TABLE "Node" ADD COLUMN "entityType" TEXT, ADD COLUMN "entityId" TEXT;
CREATE INDEX "Node_entityType_entityId_idx" ON "Node"("entityType", "entityId");

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "kind" "OrganizationKind" NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Organization_name_key" ON "Organization"("name");

CREATE TABLE "PowerPlant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT,
    "fuel" "FuelKind" NOT NULL,
    "capacityMw" DECIMAL(10,2),
    "commissionedOn" TIMESTAMP(3),
    "retiredOn" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "sourceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PowerPlant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PowerPlant_name_key" ON "PowerPlant"("name");
CREATE INDEX "PowerPlant_organizationId_idx" ON "PowerPlant"("organizationId");
CREATE INDEX "PowerPlant_fuel_idx" ON "PowerPlant"("fuel");

CREATE TABLE "GeneratingUnit" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacityMw" DECIMAL(10,2),
    "commissionedOn" TIMESTAMP(3),
    "retiredOn" TIMESTAMP(3),
    CONSTRAINT "GeneratingUnit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GeneratingUnit_plantId_name_key" ON "GeneratingUnit"("plantId", "name");

CREATE TABLE "Substation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "voltageKv" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    CONSTRAINT "Substation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Substation_name_key" ON "Substation"("name");

CREATE TABLE "TransmissionLine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fromSubstationId" TEXT NOT NULL,
    "toSubstationId" TEXT NOT NULL,
    "voltageKv" INTEGER NOT NULL,
    "circuitKm" DECIMAL(10,2),
    CONSTRAINT "TransmissionLine_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TransmissionLine_name_key" ON "TransmissionLine"("name");
CREATE INDEX "TransmissionLine_fromSubstationId_idx" ON "TransmissionLine"("fromSubstationId");
CREATE INDEX "TransmissionLine_toSubstationId_idx" ON "TransmissionLine"("toSubstationId");

CREATE TABLE "Interconnector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "counterpartyCountry" TEXT NOT NULL,
    "capacityMw" DECIMAL(10,2),
    CONSTRAINT "Interconnector_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Interconnector_name_key" ON "Interconnector"("name");

CREATE TABLE "GasField" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "operatorId" TEXT,
    "capacityMmcfd" DECIMAL(10,2),
    CONSTRAINT "GasField_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GasField_name_key" ON "GasField"("name");
CREATE INDEX "GasField_operatorId_idx" ON "GasField"("operatorId");

CREATE TABLE "PowerProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL,
    "becomesPlantId" TEXT,
    CONSTRAINT "PowerProject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PowerProject_name_key" ON "PowerProject"("name");
CREATE INDEX "PowerProject_becomesPlantId_idx" ON "PowerProject"("becomesPlantId");

CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "kind" "ContractKind" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "plantId" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Contract_organizationId_idx" ON "Contract"("organizationId");
CREATE INDEX "Contract_plantId_idx" ON "Contract"("plantId");

CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "publisher" "Publisher" NOT NULL,
    "filename" TEXT NOT NULL,
    "contentSha256" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parserVersion" TEXT,
    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SourceDocument_publisher_contentSha256_key" ON "SourceDocument"("publisher", "contentSha256");
CREATE INDEX "SourceDocument_publisher_windowStart_idx" ON "SourceDocument"("publisher", "windowStart");

CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "basis" "ObservationBasis" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Observation_subjectType_subjectId_metric_windowStart_idx" ON "Observation"("subjectType", "subjectId", "metric", "windowStart");
CREATE INDEX "Observation_sourceDocumentId_idx" ON "Observation"("sourceDocumentId");

-- AddForeignKey
ALTER TABLE "PowerPlant" ADD CONSTRAINT "PowerPlant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PowerPlant" ADD CONSTRAINT "PowerPlant_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneratingUnit" ADD CONSTRAINT "GeneratingUnit_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "PowerPlant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransmissionLine" ADD CONSTRAINT "TransmissionLine_fromSubstationId_fkey" FOREIGN KEY ("fromSubstationId") REFERENCES "Substation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TransmissionLine" ADD CONSTRAINT "TransmissionLine_toSubstationId_fkey" FOREIGN KEY ("toSubstationId") REFERENCES "Substation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GasField" ADD CONSTRAINT "GasField_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PowerProject" ADD CONSTRAINT "PowerProject_becomesPlantId_fkey" FOREIGN KEY ("becomesPlantId") REFERENCES "PowerPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "PowerPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
