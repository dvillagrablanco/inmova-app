-- Add new CandidateStatus enum values for prealquiler pipeline
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'contactado';
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'visita_programada';
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'visita_realizada';
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'reservado';
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'descartado';

-- Add asignada to IncidentStatus for incidencias pipeline
ALTER TYPE "IncidentStatus" ADD VALUE IF NOT EXISTS 'asignada';
