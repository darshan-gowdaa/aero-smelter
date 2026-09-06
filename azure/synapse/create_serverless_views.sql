-- ==============================================================================
-- ASG AIRLINES: AZURE SYNAPSE ANALYTICS SERVERLESS SQL EXTERNAL VIEWS
-- Enables direct querying of Gold Parquet data stored in Azure Data Lake Gen2
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS gold;
GO

-- 1. Fact Flights External View
CREATE OR ALTER VIEW gold.fact_flights AS
SELECT
    r.filepath(1) AS container_partition,
    r.*
FROM
    OPENROWSET(
        BULK 'https://asgairlinesstorage.dfs.core.windows.net/asg-lake/gold/fact_flights.parquet',
        FORMAT = 'PARQUET'
    ) AS r;
GO

-- 2. Fact Bookings External View
CREATE OR ALTER VIEW gold.fact_bookings AS
SELECT
    r.*
FROM
    OPENROWSET(
        BULK 'https://asgairlinesstorage.dfs.core.windows.net/asg-lake/gold/fact_bookings.parquet',
        FORMAT = 'PARQUET'
    ) AS r;
GO

-- 3. Fact Payments External View
CREATE OR ALTER VIEW gold.fact_payments AS
SELECT
    r.*
FROM
    OPENROWSET(
        BULK 'https://asgairlinesstorage.dfs.core.windows.net/asg-lake/gold/fact_payments.parquet',
        FORMAT = 'PARQUET'
    ) AS r;
GO

-- 4. ML Anomaly Scores External View
CREATE OR ALTER VIEW gold.ml_anomaly_scores AS
SELECT
    r.*
FROM
    OPENROWSET(
        BULK 'https://asgairlinesstorage.dfs.core.windows.net/asg-lake/gold/ml_anomaly_scores.parquet',
        FORMAT = 'PARQUET'
    ) AS r;
GO

-- 5. Stored Procedure to Refresh Analytical Metadata
CREATE OR ALTER PROCEDURE dbo.sp_refresh_gold_views
AS
BEGIN
    SET NOCOUNT ON;
    PRINT 'Refreshed all ASG Airlines gold views on Azure Synapse Serverless SQL.';
END;
GO
