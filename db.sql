/****** Object:  Table [dbo].[Matcon]    Script Date: 04/08/2020 17:26:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Matcon](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[UserId] [int] NOT NULL,
	[Name] [nvarchar](200) NOT NULL,
	[Rating] [float] NOT NULL,
	[Data] [nvarchar](max) NOT NULL,
 CONSTRAINT [PK_Matcon] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MatconRating]    Script Date: 04/08/2020 17:26:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MatconRating](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[MatconId] [int] NOT NULL,
	[UserId] [int] NOT NULL,
	[Timestamp] [datetime] NOT NULL,
	[Rating] [int] NOT NULL,
	[Data] [nvarchar](max) NOT NULL,
 CONSTRAINT [PK_MatconRating] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MatconTag]    Script Date: 04/08/2020 17:26:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MatconTag](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[MatconId] [int] NOT NULL,
	[Tag] [nvarchar](100) NOT NULL,
 CONSTRAINT [PK_MatconTag] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[PreRegister]    Script Date: 04/08/2020 17:26:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[PreRegister](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Email] [nvarchar](320) NOT NULL,
	[Token] [char](100) NOT NULL,
	[Timestamp] [datetime] NOT NULL,
	[EmailValidated] [bit] NOT NULL,
 CONSTRAINT [PK_PreRegister] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[User]    Script Date: 04/08/2020 17:26:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[User](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Email] [nvarchar](320) NOT NULL,
	[Data] [nvarchar](max) NOT NULL,
 CONSTRAINT [PK_User] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserAuth]    Script Date: 04/08/2020 17:26:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserAuth](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[UserId] [int] NOT NULL,
	[Token] [varchar](100) NOT NULL,
	[Data] [nvarchar](max) NOT NULL,
 CONSTRAINT [PK_UserAuth] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[PreRegister] ADD  CONSTRAINT [DF_PreRegister_EmailValidated]  DEFAULT ((0)) FOR [EmailValidated]
GO
ALTER TABLE [dbo].[Matcon]  WITH CHECK ADD  CONSTRAINT [FK_Matcon_User] FOREIGN KEY([UserId])
REFERENCES [dbo].[User] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Matcon] CHECK CONSTRAINT [FK_Matcon_User]
GO
ALTER TABLE [dbo].[MatconRating]  WITH CHECK ADD  CONSTRAINT [FK_MatconRating_Matcon] FOREIGN KEY([MatconId])
REFERENCES [dbo].[Matcon] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[MatconRating] CHECK CONSTRAINT [FK_MatconRating_Matcon]
GO
ALTER TABLE [dbo].[MatconRating]  WITH CHECK ADD  CONSTRAINT [FK_MatconRating_User] FOREIGN KEY([UserId])
REFERENCES [dbo].[User] ([Id])
GO
ALTER TABLE [dbo].[MatconRating] CHECK CONSTRAINT [FK_MatconRating_User]
GO
ALTER TABLE [dbo].[MatconTag]  WITH CHECK ADD  CONSTRAINT [FK_MatconTag_Matcon] FOREIGN KEY([MatconId])
REFERENCES [dbo].[Matcon] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[MatconTag] CHECK CONSTRAINT [FK_MatconTag_Matcon]
GO
ALTER TABLE [dbo].[UserAuth]  WITH CHECK ADD  CONSTRAINT [FK_UserAuth_User] FOREIGN KEY([UserId])
REFERENCES [dbo].[User] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[UserAuth] CHECK CONSTRAINT [FK_UserAuth_User]
GO
/****** Object:  StoredProcedure [dbo].[DeleteOldPreRegisters]    Script Date: 04/08/2020 17:26:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[DeleteOldPreRegisters]
(
    -- Add the parameters for the stored procedure here
    @ExpirationDays int = 3
)
AS
BEGIN
    -- SET NOCOUNT ON added to prevent extra result sets FROM
    -- interfering with SELECT statements.
    SET NOCOUNT ON

    -- Insert statements for procedure here
    DELETE FROM PreRegister WHERE [Timestamp] < DATEADD(day, @ExpirationDays*-1, GETDATE())
	
	SELECT @@ROWCOUNT as [Deleted]
END
GO
/****** Object:  StoredProcedure [dbo].[GetMatcon]    Script Date: 04/08/2020 17:26:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[GetMatcon]
(
    @Id int = 0
)
AS
BEGIN
    SET NOCOUNT ON

	SELECT * FROM [Matcon] WHERE [Id] = @Id

	SELECT [User].[Data] FROM [User] INNER JOIN [Matcon] ON [Matcon].[UserId] = [User].[Id] WHERE [Matcon].[Id] = @Id

	SELECT AVG([MatconRating].[Rating]) AS [Rating], COUNT([MatconRating].[Id]) AS [RatingCount] FROM [MatconRating] WHERE [MatconRating].[MatconId] = @Id

	SELECT [MatconTag].[Id], [MatconTag].[Tag] FROM [MatconTag] WHERE [MatconTag].[MatconId] = @Id

    
END
GO

/****** Object:  StoredProcedure [dbo].[AddReview]    Script Date: 04/08/2020 17:26:42 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[AddReview]
(
    @MatconId INT,
	@Rating INT,
	@UserId INT,
	@Data NVARCHAR(MAX)
)
AS
BEGIN
    SET NOCOUNT ON

	DELETE FROM [MatconRating] WHERE [MatconId] = @MatconId AND [UserId] = @UserId

	INSERT INTO [MatconRating] VALUES (@MatconId, @UserId, GETDATE(), @Rating, @Data);

	UPDATE [Matcon] SET [Rating] = (SELECT AVG(Cast([MatconRating].[Rating] as Float)) FROM [MatconRating] WHERE [MatconId] = @MatconId)

END
GO

/****** Object:  StoredProcedure [dbo].[DeleteReview]    Script Date: 04/08/2020 17:26:42 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[DeleteReview]
(
    @Id INT
)
AS
BEGIN
    SET NOCOUNT ON

	DECLARE @MatconId INT;

	SET @MatconId = (SELECT [MatconId] FROM [MatconRating] WHERE [Id] = @Id)

	DELETE FROM [MatconRating] WHERE [Id] = @Id

	UPDATE [Matcon] SET [Rating] = ISNULL((SELECT AVG(Cast([MatconRating].[Rating] as Float)) FROM [MatconRating] WHERE [MatconId] = @MatconId), 0)

END
GO
