-- Autoriser les notifications de séance planifiée (popup + cloche apprenant)
ALTER TABLE learner_notification
  DROP CONSTRAINT IF EXISTS learner_notification_kind_check;

ALTER TABLE learner_notification
  ADD CONSTRAINT learner_notification_kind_check
  CHECK (
    kind = ANY (
      ARRAY[
        'doc_validated'::text,
        'doc_rejected'::text,
        'cert_available'::text,
        'session_scheduled'::text
      ]
    )
  );
