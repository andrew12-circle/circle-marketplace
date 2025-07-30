import React, { useState, useCallback } from 'react';
import { useSecureInput, ValidationRules } from '@/hooks/useSecureInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface SecureFormProps {
  children: React.ReactNode;
  validationRules: ValidationRules;
  onSubmit: (data: Record<string, string>) => Promise<void> | void;
  onValidationError?: (errors: Record<string, string>) => void;
  className?: string;
}

export const SecureForm: React.FC<SecureFormProps> = ({
  children,
  validationRules,
  onSubmit,
  onValidationError,
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { errors, validateForm, sanitizeForm, clearErrors } = useSecureInput(validationRules);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    clearErrors();

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    // Validate form
    const isValid = validateForm(data);
    if (!isValid) {
      onValidationError?.(errors);
      return;
    }

    // Sanitize data
    const sanitizedData = sanitizeForm(data);

    try {
      setIsSubmitting(true);
      await onSubmit(sanitizedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, sanitizeForm, onSubmit, onValidationError, errors, clearErrors]);

  return (
    <form onSubmit={handleSubmit} className={className}>
      {submitError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please fix the following errors:
            <ul className="list-disc list-inside mt-2">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {children}

      <input
        type="hidden"
        name="_csrf_token"
        value={crypto.randomUUID()}
        readOnly
      />
    </form>
  );
};

export default SecureForm;