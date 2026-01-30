'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Sparkles,
  FileText,
  User,
  CreditCard,
  Calendar,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

// Tipos para los campos extraídos
interface ExtractedField {
  fieldName: string;
  fieldValue: string;
  dataType: string;
  confidence: number;
  targetEntity?: string;
  targetField?: string;
}

interface DataReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  extractedFields: ExtractedField[];
  documentName: string;
  documentType: string;
  onConfirm: (selectedFields: Record<string, string>) => void;
}

// Mapeo de campos a nombres legibles en español
const fieldLabels: Record<string, string> = {
  // Datos personales
  nombre: 'Nombre Completo',
  nombreCompleto: 'Nombre Completo',
  name: 'Nombre',
  fullName: 'Nombre Completo',
  firstName: 'Nombre',
  lastName: 'Apellidos',
  apellidos: 'Apellidos',
  
  // Documento de identidad
  dni: 'DNI/NIE',
  nie: 'NIE',
  documentNumber: 'Número de Documento',
  numeroDocumento: 'Número de Documento',
  
  // Fechas
  fechaNacimiento: 'Fecha de Nacimiento',
  birthDate: 'Fecha de Nacimiento',
  dateOfBirth: 'Fecha de Nacimiento',
  fechaExpedicion: 'Fecha de Expedición',
  issueDate: 'Fecha de Expedición',
  fechaCaducidad: 'Fecha de Caducidad',
  expirationDate: 'Fecha de Caducidad',
  expiryDate: 'Fecha de Caducidad',
  
  // Contacto
  email: 'Email',
  telefono: 'Teléfono',
  phone: 'Teléfono',
  
  // Dirección
  direccion: 'Dirección',
  address: 'Dirección',
  ciudad: 'Ciudad',
  city: 'Ciudad',
  codigoPostal: 'Código Postal',
  postalCode: 'Código Postal',
  provincia: 'Provincia',
  pais: 'País',
  country: 'País',
  
  // Otros
  nacionalidad: 'Nacionalidad',
  nationality: 'Nacionalidad',
  sexo: 'Sexo',
  sex: 'Sexo',
  gender: 'Género',
  lugarNacimiento: 'Lugar de Nacimiento',
  birthPlace: 'Lugar de Nacimiento',
};

// Iconos por tipo de campo
const getFieldIcon = (fieldName: string) => {
  const lowerField = fieldName.toLowerCase();
  
  if (lowerField.includes('nombre') || lowerField.includes('name')) {
    return User;
  }
  if (lowerField.includes('dni') || lowerField.includes('nie') || lowerField.includes('document')) {
    return CreditCard;
  }
  if (lowerField.includes('fecha') || lowerField.includes('date')) {
    return Calendar;
  }
  if (lowerField.includes('direccion') || lowerField.includes('address') || lowerField.includes('ciudad')) {
    return MapPin;
  }
  if (lowerField.includes('telefono') || lowerField.includes('phone')) {
    return Phone;
  }
  if (lowerField.includes('email') || lowerField.includes('mail')) {
    return Mail;
  }
  
  return FileText;
};

export function DataReviewDialog({
  isOpen,
  onClose,
  extractedFields,
  documentName,
  documentType,
  onConfirm,
}: DataReviewDialogProps) {
  // Estado para los campos editables
  const [editableFields, setEditableFields] = useState<Record<string, string>>({});
  // Estado para los campos seleccionados
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  // Estado para modo edición
  const [editingField, setEditingField] = useState<string | null>(null);

  // Inicializar campos cuando se abra el diálogo
  useEffect(() => {
    if (isOpen && extractedFields.length > 0) {
      const fields: Record<string, string> = {};
      const selected: Record<string, boolean> = {};
      
      extractedFields.forEach((field) => {
        const key = field.targetField || field.fieldName;
        fields[key] = field.fieldValue;
        // Seleccionar por defecto si tiene alta confianza
        selected[key] = field.confidence >= 0.7;
      });
      
      setEditableFields(fields);
      setSelectedFields(selected);
    }
  }, [isOpen, extractedFields]);

  // Manejar cambio en campo
  const handleFieldChange = (fieldKey: string, value: string) => {
    setEditableFields((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  // Toggle selección de campo
  const toggleFieldSelection = (fieldKey: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  // Seleccionar/deseleccionar todos
  const toggleAll = (select: boolean) => {
    const newSelected: Record<string, boolean> = {};
    Object.keys(editableFields).forEach((key) => {
      newSelected[key] = select;
    });
    setSelectedFields(newSelected);
  };

  // Confirmar selección
  const handleConfirm = () => {
    const dataToApply: Record<string, string> = {};
    
    Object.entries(selectedFields).forEach(([key, isSelected]) => {
      if (isSelected && editableFields[key]) {
        dataToApply[key] = editableFields[key];
      }
    });

    if (Object.keys(dataToApply).length === 0) {
      toast.warning('No hay campos seleccionados para aplicar');
      return;
    }

    onConfirm(dataToApply);
    onClose();
    toast.success(`${Object.keys(dataToApply).length} campos aplicados al formulario`);
  };

  // Contar campos seleccionados
  const selectedCount = Object.values(selectedFields).filter(Boolean).length;
  const totalCount = Object.keys(editableFields).length;

  // Obtener nivel de confianza del campo
  const getFieldConfidence = (fieldKey: string): number => {
    const field = extractedFields.find(
      (f) => f.targetField === fieldKey || f.fieldName === fieldKey
    );
    return field?.confidence || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Revisar Datos Extraídos
          </DialogTitle>
          <DialogDescription>
            Verifica los datos extraídos del documento <strong>{documentName}</strong>.
            Puedes editar o deseleccionar campos antes de aplicarlos al formulario.
          </DialogDescription>
        </DialogHeader>

        {/* Información del documento */}
        <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
          <FileText className="h-5 w-5 text-violet-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{documentName}</p>
            <p className="text-xs text-muted-foreground">{documentType}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalCount} campos detectados
          </Badge>
        </div>

        {/* Controles de selección */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectedCount === totalCount && totalCount > 0}
              onCheckedChange={(checked) => toggleAll(!!checked)}
            />
            <Label htmlFor="select-all" className="text-sm cursor-pointer">
              {selectedCount === totalCount ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </Label>
          </div>
          <Badge variant="secondary">
            {selectedCount}/{totalCount} seleccionados
          </Badge>
        </div>

        {/* Lista de campos */}
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-2 py-2">
            {extractedFields.map((field, index) => {
              const fieldKey = field.targetField || field.fieldName;
              const isSelected = selectedFields[fieldKey] || false;
              const isEditing = editingField === fieldKey;
              const confidence = field.confidence;
              const Icon = getFieldIcon(fieldKey);
              const label = fieldLabels[fieldKey] || field.fieldName;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-violet-300 bg-violet-50/50 dark:bg-violet-950/20'
                      : 'border-gray-200 dark:border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleFieldSelection(fieldKey)}
                      className="mt-1"
                    />

                    {/* Icono */}
                    <div className="h-8 w-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="text-sm font-medium">{label}</Label>
                        {/* Badge de confianza */}
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            confidence >= 0.9
                              ? 'border-green-500 text-green-700'
                              : confidence >= 0.7
                                ? 'border-amber-500 text-amber-700'
                                : 'border-red-500 text-red-700'
                          }`}
                        >
                          {Math.round(confidence * 100)}%
                        </Badge>
                      </div>

                      {/* Valor editable */}
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Input
                            value={editableFields[fieldKey] || ''}
                            onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingField(null)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {editableFields[fieldKey] || '-'}
                          </p>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 shrink-0"
                            onClick={() => setEditingField(fieldKey)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Warning si baja confianza */}
                      {confidence < 0.7 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Baja confianza - verificar manualmente</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Aplicar {selectedCount} {selectedCount === 1 ? 'campo' : 'campos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DataReviewDialog;
