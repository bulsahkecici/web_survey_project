-- Create DB if needed (optional)
CREATE DATABASE SurveyDB;
GO
USE SurveyDB;
GO

/* ----------------------------------------------------
   DROP (child -> parent)  — güvenli temiz başlatma
---------------------------------------------------- */
IF OBJECT_ID('dbo.answers','U')     IS NOT NULL DROP TABLE dbo.answers;
IF OBJECT_ID('dbo.responses','U')   IS NOT NULL DROP TABLE dbo.responses;
IF OBJECT_ID('dbo.invitations','U') IS NOT NULL DROP TABLE dbo.invitations;
IF OBJECT_ID('dbo.questions','U')   IS NOT NULL DROP TABLE dbo.questions;
IF OBJECT_ID('dbo.survey_sections','U') IS NOT NULL DROP TABLE dbo.survey_sections;
IF OBJECT_ID('dbo.surveys','U')     IS NOT NULL DROP TABLE dbo.surveys;
GO

/* ----------------------------------------------------
   1) Surveys
---------------------------------------------------- */
CREATE TABLE dbo.surveys (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  slug          NVARCHAR(100) NOT NULL UNIQUE,
  title         NVARCHAR(200) NOT NULL,
  is_active     BIT NOT NULL DEFAULT 1,
  created_at    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ----------------------------------------------------
   2) Survey Sections (Bölümler)
---------------------------------------------------- */
CREATE TABLE dbo.survey_sections (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  survey_id     INT NOT NULL,
  name          NVARCHAR(200) NOT NULL,
  ord           INT NOT NULL,
  created_at    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

ALTER TABLE dbo.survey_sections WITH CHECK
ADD CONSTRAINT FK_sections_survey
FOREIGN KEY (survey_id) REFERENCES dbo.surveys(id)
ON DELETE CASCADE;
GO

CREATE INDEX IX_sections_survey ON dbo.survey_sections (survey_id, ord);
GO

/* ----------------------------------------------------
   3) Questions (Koşullu akış ve bölüm desteği eklendi)
---------------------------------------------------- */
CREATE TABLE dbo.questions (
  id                INT IDENTITY(1,1) PRIMARY KEY,
  survey_id         INT NOT NULL,
  section_id        INT NULL,
  ord               INT NOT NULL,
  label             NVARCHAR(400) NOT NULL,
  type              NVARCHAR(20) NOT NULL,
  required          BIT NOT NULL DEFAULT 0,
  options_json      NVARCHAR(MAX) NULL,
  conditional_logic NVARCHAR(MAX) NULL
);
GO

ALTER TABLE dbo.questions WITH CHECK
ADD CONSTRAINT FK_questions_survey
FOREIGN KEY (survey_id) REFERENCES dbo.surveys(id)
ON DELETE CASCADE;
GO

ALTER TABLE dbo.questions WITH CHECK
ADD CONSTRAINT FK_questions_section
FOREIGN KEY (section_id) REFERENCES dbo.survey_sections(id);
GO

CREATE INDEX IX_questions_survey ON dbo.questions (survey_id, ord);
GO

/* ----------------------------------------------------
   4) Invitations
---------------------------------------------------- */
CREATE TABLE dbo.invitations (
  id            INT IDENTITY(1,1) PRIMARY KEY,
  survey_id     INT NOT NULL,
  email         NVARCHAR(320) NOT NULL,
  token         CHAR(36) NOT NULL,
  created_at    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  used_at       DATETIME2 NULL
);
GO

ALTER TABLE dbo.invitations WITH CHECK
ADD CONSTRAINT FK_invitations_survey
FOREIGN KEY (survey_id) REFERENCES dbo.surveys(id)
ON DELETE CASCADE;
GO

CREATE UNIQUE INDEX UX_invitations_token ON dbo.invitations(token);
CREATE INDEX IX_invitations_survey_email ON dbo.invitations (survey_id, email);
GO

/* ----------------------------------------------------
   5) Responses
---------------------------------------------------- */
CREATE TABLE dbo.responses (
  id            BIGINT IDENTITY(1,1) PRIMARY KEY,
  survey_id     INT NOT NULL,
  invitation_id INT NULL,
  email         NVARCHAR(320) NOT NULL,
  submitted_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

ALTER TABLE dbo.responses WITH CHECK
ADD CONSTRAINT FK_responses_survey
FOREIGN KEY (survey_id) REFERENCES dbo.surveys(id)
ON DELETE CASCADE;
GO

ALTER TABLE dbo.responses WITH CHECK
ADD CONSTRAINT FK_responses_invitation
FOREIGN KEY (invitation_id) REFERENCES dbo.invitations(id);
GO

CREATE UNIQUE INDEX UX_responses_survey_email ON dbo.responses(survey_id, email);
GO

/* ----------------------------------------------------
   6) Answers  (FIX: tek taraflı CASCADE)
   - response_id  : ON DELETE CASCADE (kalsın)
   - question_id  : NO ACTION (CASCADE YOK) -> multiple cascade paths hatasını önler
---------------------------------------------------- */
CREATE TABLE dbo.answers (
  id            BIGINT IDENTITY(1,1) NOT NULL,
  response_id   BIGINT NOT NULL,
  question_id   INT NOT NULL,
  value_text    NVARCHAR(MAX) NULL,
  CONSTRAINT PK_answers PRIMARY KEY CLUSTERED (id)
);
GO

ALTER TABLE dbo.answers WITH CHECK
ADD CONSTRAINT FK_answers_response
FOREIGN KEY (response_id) REFERENCES dbo.responses(id)
ON DELETE CASCADE;
GO

ALTER TABLE dbo.answers WITH CHECK
ADD CONSTRAINT FK_answers_question
FOREIGN KEY (question_id) REFERENCES dbo.questions(id);
GO

CREATE INDEX IX_answers_response ON dbo.answers (response_id);
GO

/* ----------------------------------------------------
   Stored Procedure: sp_submit_response
---------------------------------------------------- */
IF OBJECT_ID('dbo.sp_submit_response','P') IS NOT NULL DROP PROCEDURE dbo.sp_submit_response;
GO
CREATE PROCEDURE dbo.sp_submit_response
  @survey_slug NVARCHAR(100),
  @email       NVARCHAR(320),
  @token       CHAR(36) = NULL,
  @answers     NVARCHAR(MAX)
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRY
    BEGIN TRAN;

    DECLARE @survey_id INT;
    SELECT @survey_id = id FROM dbo.surveys WHERE slug = @survey_slug AND is_active = 1;
    IF @survey_id IS NULL
      THROW 50001, 'Anket bulunamadı veya aktif değil.', 1;

    DECLARE @inv_id INT = NULL, @inv_email NVARCHAR(320) = NULL, @used_at DATETIME2 = NULL;
    IF @token IS NOT NULL
    BEGIN
      SELECT @inv_id = i.id, @inv_email = i.email, @used_at = i.used_at
      FROM dbo.invitations i
      WHERE i.token = @token AND i.survey_id = @survey_id;

      IF @inv_id IS NULL
        THROW 50002, 'Geçersiz davetiye token.', 1;
      IF @used_at IS NOT NULL
        THROW 50003, 'Davetiye daha önce kullanılmış.', 1;
      IF @inv_email IS NOT NULL AND LTRIM(RTRIM(LOWER(@inv_email))) <> LTRIM(RTRIM(LOWER(@email)))
        THROW 50004, 'Davetiye e-postası uyuşmuyor.', 1;
    END

    IF EXISTS (SELECT 1 FROM dbo.responses WHERE survey_id = @survey_id AND LOWER(email) = LOWER(@email))
      THROW 50005, 'Bu e-posta adresi ile anket daha önce doldurulmuş.', 1;

    INSERT INTO dbo.responses(survey_id, invitation_id, email)
    VALUES(@survey_id, @inv_id, @email);
    DECLARE @response_id BIGINT = SCOPE_IDENTITY();

    ;WITH j AS (
      SELECT
        CAST(JSON_VALUE(value, '$.questionId') AS INT) AS question_id,
        JSON_VALUE(value, '$.value') AS value_text
      FROM OPENJSON(@answers)
    )
    INSERT INTO dbo.answers(response_id, question_id, value_text)
    SELECT @response_id, q.id, j.value_text
    FROM j
    JOIN dbo.questions q ON q.id = j.question_id AND q.survey_id = @survey_id;

    IF @inv_id IS NOT NULL
      UPDATE dbo.invitations SET used_at = SYSUTCDATETIME() WHERE id = @inv_id;

    COMMIT;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    DECLARE @msg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@msg, 16, 1);
    RETURN;
  END CATCH
END
GO

/* ----------------------------------------------------
   Seed data (örnek anket)
---------------------------------------------------- */
INSERT INTO dbo.surveys (slug, title, is_active)
VALUES ('ornek-anket', N'Örnek Müşteri Memnuniyeti Anketi', 1);
DECLARE @sid INT = SCOPE_IDENTITY();

INSERT INTO dbo.questions(survey_id, section_id, ord, label, type, required, options_json, conditional_logic)
VALUES
(@sid, NULL, 1, N'E-posta ile bilgilendirme almak ister misiniz?', 'single', 1, N'["Evet","Hayır"]', NULL),
(@sid, NULL, 2, N'Ürün hakkındaki genel görüşünüz?', 'likert', 1, N'["1-Kötü","2","3","4","5-Çok İyi"]', NULL),
(@sid, NULL, 3, N'En çok beğendiğiniz özellik(ler)?', 'multiple', 0, N'["Hız","Tasarım","Fiyat","Destek"]', NULL),
(@sid, NULL, 4, N'Eklemek istediğiniz bir yorum var mı?', 'text', 0, NULL, NULL);
GO
