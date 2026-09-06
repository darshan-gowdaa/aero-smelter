import os
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Output directory for diagram images
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "reports" / "assets"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def create_architecture_diagram():
    # Draws the 3-tier Medallion architecture: Bronze -> Silver -> Gold -> Consumption
    fig, ax = plt.subplots(figsize=(12, 6.5), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 6.5)
    ax.axis("off")

    # Background color
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_facecolor("#F8FAFC")

    # Title
    ax.text(6, 6.0, "ASG Airlines Data Engineering Architecture (Medallion Flow)",
            ha="center", va="center", fontsize=15, fontweight="bold", color="#0F172A")

    # Layer boxes definition
    # x, y, width, height, color, title, subtitle, details
    layers = [
        (0.6, 1.0, 2.3, 4.4, "#92400E", "#FEF3C7", "BRONZE LAYER\n(Raw Data)",
         "Raw Ingestion",
         ["4 Excel Sheets", "Schema Validation", "Preserved As-Is", "Quarantine Logs", "Parquet Snapshots"]),
        (3.4, 1.0, 2.3, 4.4, "#475569", "#F1F5F9", "SILVER LAYER\n(Cleansed)",
         "Transformations",
         ["Flight ID Repairs", "Overnight Duration Fix", "Deduplication", "PII Hashing (SHA256)", "Secure Salt Vault"]),
        (6.2, 1.0, 2.3, 4.4, "#B45309", "#FEF9C3", "GOLD LAYER\n(Dimensional)",
         "Business Model",
         ["Star Schema Model", "fact_flights / bookings", "dim_airline / route", "Outlier Flagging", "KPI Aggregations"]),
        (9.0, 1.0, 2.4, 4.4, "#1E3A8A", "#DBEAFE", "CONSUMPTION\n(Reporting)",
         "Analytics & BI",
         ["Power BI 4-Page App", "Executive Dashboards", "Route Optimization", "Revenue Audits", "Parquet & CSV Exports"])
    ]

    for x, y, w, h, border_c, bg_c, header, sub, bullets in layers:
        # Outer box
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1",
                                      facecolor=bg_c, edgecolor=border_c, linewidth=2)
        ax.add_patch(rect)
        
        # Header banner
        ax.text(x + w / 2, y + h - 0.45, header, ha="center", va="center",
                fontsize=11, fontweight="bold", color=border_c)
        ax.text(x + w / 2, y + h - 0.95, sub, ha="center", va="center",
                fontsize=9, fontstyle="italic", color="#334155")
        
        # Bullet points
        start_by = y + h - 1.4
        for i, b in enumerate(bullets):
            ax.text(x + 0.18, start_by - (i * 0.52), f"• {b}", ha="left", va="center",
                    fontsize=8.5, color="#1E293B")

    # Arrows connecting the layers
    arrow_props = dict(facecolor="#0284C7", edgecolor="#0284C7", width=3, headwidth=9, shrink=0.1)
    ax.annotate("", xy=(3.35, 3.2), xytext=(2.95, 3.2), arrowprops=arrow_props)
    ax.annotate("", xy=(6.15, 3.2), xytext=(5.75, 3.2), arrowprops=arrow_props)
    ax.annotate("", xy=(8.95, 3.2), xytext=(8.55, 3.2), arrowprops=arrow_props)

    # Footer note
    ax.text(6, 0.4, "Production Architecture: Idempotent Ingestion • Cryptographic PII Vault • Zero Data Loss",
            ha="center", va="center", fontsize=9, color="#64748B")

    out_path = OUTPUT_DIR / "architecture_diagram.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"Generated: {out_path}")

def create_star_schema_diagram():
    # Draws the star schema entity relationship diagram for the Gold Layer
    fig, ax = plt.subplots(figsize=(13, 7.5), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 7.5)
    ax.axis("off")

    fig.patch.set_facecolor("#F8FAFC")
    ax.set_facecolor("#F8FAFC")

    # Title
    ax.text(6.5, 7.0, "ASG Airlines Gold Layer Star Schema Data Model",
            ha="center", va="center", fontsize=15, fontweight="bold", color="#0F172A")

    # Central Facts (fact_flights, fact_bookings, fact_payments)
    # Box parameters: (x, y, w, h, bg, border, title, fields)
    facts = [
        (4.5, 4.0, 4.0, 2.3, "#EFF6FF", "#1D4ED8", "FACT_FLIGHTS", [
            "PK flight_instance_id : INT",
            "FK airline_key : INT -> dim_airline",
            "FK route_key : INT -> dim_route",
            "FK departure_date_key : INT -> dim_date",
            "departure_time, arrival_time : DATETIME",
            "duration_minutes : FLOAT",
            "is_overnight, is_duration_outlier : BOOL"
        ]),
        (4.5, 1.4, 4.0, 2.2, "#EFF6FF", "#1D4ED8", "FACT_BOOKINGS & PAYMENTS", [
            "PK booking_id : STRING",
            "FK passenger_key : INT -> dim_passenger",
            "FK route_key, airline_key : INT",
            "status (CONFIRMED, CANCELLED)",
            "payment_id, payment_method, amount",
            "is_amount_imputed : BOOL"
        ])
    ]

    for x, y, w, h, bg_c, border_c, title, fields in facts:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08",
                                      facecolor=bg_c, edgecolor=border_c, linewidth=2)
        ax.add_patch(rect)
        ax.text(x + w / 2, y + h - 0.25, title, ha="center", va="center",
                fontsize=10.5, fontweight="bold", color=border_c)
        for i, f in enumerate(fields):
            ax.text(x + 0.15, y + h - 0.55 - (i * 0.26), f, ha="left", va="center",
                    fontsize=8, fontfamily="monospace", color="#1E293B")

    # Dimensions
    dims = [
        (0.6, 4.4, 3.2, 2.0, "#F0FDF4", "#15803D", "DIM_AIRLINE", [
            "PK airline_key : INT",
            "airline_name : STRING",
            "airline_code : STRING (AI, 6E, SJ, UK)",
            "country : STRING"
        ]),
        (0.6, 1.6, 3.2, 2.2, "#F0FDF4", "#15803D", "DIM_ROUTE", [
            "PK route_key : INT",
            "source, destination : STRING",
            "source_city, dest_city : STRING",
            "route_name : STRING (e.g. BOM -> DEL)",
            "route_full_name : STRING"
        ]),
        (9.2, 4.4, 3.2, 2.0, "#F0FDF4", "#15803D", "DIM_DATE", [
            "PK date_key : INT (YYYYMMDD)",
            "full_date : DATE",
            "year, month, day : INT",
            "day_name, month_name : STRING",
            "is_weekend : BOOL"
        ]),
        (9.2, 1.4, 3.2, 2.4, "#F0FDF4", "#15803D", "DIM_PASSENGER", [
            "PK passenger_key : INT",
            "passenger_id : STRING",
            "gender, age, age_band : STRING",
            "email_masked, phone_masked : STRING",
            "aadhaar_masked : STRING",
            "passenger_name_masked : STRING"
        ])
    ]

    for x, y, w, h, bg_c, border_c, title, fields in dims:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08",
                                      facecolor=bg_c, edgecolor=border_c, linewidth=2)
        ax.add_patch(rect)
        ax.text(x + w / 2, y + h - 0.25, title, ha="center", va="center",
                fontsize=10.5, fontweight="bold", color=border_c)
        for i, f in enumerate(fields):
            ax.text(x + 0.15, y + h - 0.55 - (i * 0.26), f, ha="left", va="center",
                    fontsize=8, fontfamily="monospace", color="#1E293B")

    # Connectors
    # dim_airline to fact_flights
    ax.plot([3.8, 4.5], [5.4, 5.4], color="#64748B", linewidth=1.5, linestyle="--")
    ax.text(4.15, 5.55, "1:N", ha="center", fontsize=8, color="#0284C7", fontweight="bold")

    # dim_route to fact_flights
    ax.plot([3.8, 4.5], [2.7, 4.5], color="#64748B", linewidth=1.5, linestyle="--")
    ax.text(4.1, 3.6, "1:N", ha="center", fontsize=8, color="#0284C7", fontweight="bold")

    # dim_date to fact_flights
    ax.plot([8.5, 9.2], [5.4, 5.4], color="#64748B", linewidth=1.5, linestyle="--")
    ax.text(8.85, 5.55, "N:1", ha="center", fontsize=8, color="#0284C7", fontweight="bold")

    # dim_passenger to fact_bookings
    ax.plot([8.5, 9.2], [2.5, 2.5], color="#64748B", linewidth=1.5, linestyle="--")
    ax.text(8.85, 2.65, "N:1", ha="center", fontsize=8, color="#0284C7", fontweight="bold")

    # fact_flights to fact_bookings
    ax.plot([6.5, 6.5], [4.0, 3.6], color="#64748B", linewidth=1.5, linestyle="--")
    ax.text(6.8, 3.8, "1:N", ha="center", fontsize=8, color="#0284C7", fontweight="bold")

    # Footer
    ax.text(6.5, 0.5, "Star-ish Model Architecture: Strict Referential Integrity • Masked PII Dimensions • Analytical Facts",
            ha="center", va="center", fontsize=9, color="#64748B")

    out_path = OUTPUT_DIR / "star_schema_model.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"Generated: {out_path}")

def create_data_flow_diagram():
    # Draws the operational data transformation flow from Excel to Power BI
    fig, ax = plt.subplots(figsize=(12, 6.0), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 6.0)
    ax.axis("off")

    fig.patch.set_facecolor("#F8FAFC")
    ax.set_facecolor("#F8FAFC")

    # Title
    ax.text(6, 5.5, "ASG Airlines End-to-End Data Flow & Quality Gates",
            ha="center", va="center", fontsize=15, fontweight="bold", color="#0F172A")

    steps = [
        (0.5, 2.2, 1.8, 2.2, "#FEF3C7", "#D97706", "1. SOURCE\nEXCEL", [
            "UseCase.xlsx", "flights (1020)", "bookings (1000)", "passengers (1039)", "payments (1000)"
        ]),
        (2.8, 2.2, 1.8, 2.2, "#EFF6FF", "#2563EB", "2. INGESTION\n& VALIDATE", [
            "Schema Audit", "Check PK Nulls", "Quarantine Flag", "Raw Snapshots", "Bronze Parquet"
        ]),
        (5.1, 2.2, 1.8, 2.2, "#F3E8FF", "#9333EA", "3. TRANSFORMS\n& CLEANING", [
            "Overnight +1d", "Duration Mins", "6F/6E Prefix Map", "SHA-256 Mask", "Deduplication"
        ]),
        (7.4, 2.2, 1.8, 2.2, "#ECFDF5", "#059669", "4. GOLD\nSTAR SCHEMA", [
            "Surrogate Keys", "Fact & Dims", "Outlier Flag", "KPI Tables", "Integrity Check"
        ]),
        (9.7, 2.2, 1.8, 2.2, "#FFF1F2", "#E11D48", "5. EXPORT\n& POWER BI", [
            "Parquet + CSV", "DAX Measures", "4-Page BI App", "Slicers & Cards", "Secure Analytics"
        ])
    ]

    for x, y, w, h, bg_c, border_c, title, bullets in steps:
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.08",
                                      facecolor=bg_c, edgecolor=border_c, linewidth=2)
        ax.add_patch(rect)
        ax.text(x + w / 2, y + h - 0.35, title, ha="center", va="center",
                fontsize=9.5, fontweight="bold", color=border_c)
        for i, b in enumerate(bullets):
            ax.text(x + 0.12, y + h - 0.75 - (i * 0.30), f"• {b}", ha="left", va="center",
                    fontsize=7.5, color="#1E293B")

    # Connecting arrows
    arrow_props = dict(facecolor="#475569", edgecolor="#475569", width=2.5, headwidth=8, shrink=0.1)
    ax.annotate("", xy=(2.75, 3.3), xytext=(2.35, 3.3), arrowprops=arrow_props)
    ax.annotate("", xy=(5.05, 3.3), xytext=(4.65, 3.3), arrowprops=arrow_props)
    ax.annotate("", xy=(7.35, 3.3), xytext=(6.95, 3.3), arrowprops=arrow_props)
    ax.annotate("", xy=(9.65, 3.3), xytext=(9.25, 3.3), arrowprops=arrow_props)

    # Vault callout below step 3
    v_rect = patches.FancyBboxPatch((4.7, 0.4), 2.6, 1.2, boxstyle="round,pad=0.06",
                                    facecolor="#F1F5F9", edgecolor="#64748B", linewidth=1.5, linestyle=":")
    ax.add_patch(v_rect)
    ax.text(6.0, 1.25, "Restricted PII Vault", ha="center", va="center",
            fontsize=8.5, fontweight="bold", color="#334155")
    ax.text(6.0, 0.95, "Salted Hashes Only in Analytics", ha="center", va="center",
            fontsize=7.5, color="#475569")
    ax.text(6.0, 0.65, "Vault Stored at data/secure/", ha="center", va="center",
            fontsize=7, fontfamily="monospace", color="#64748B")

    # Line from transform to vault
    ax.plot([6.0, 6.0], [2.2, 1.6], color="#9333EA", linewidth=1.5, linestyle=":")

    out_path = OUTPUT_DIR / "data_flow_diagram.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"Generated: {out_path}")

if __name__ == "__main__":
    create_architecture_diagram()
    create_star_schema_diagram()
    create_data_flow_diagram()
    print("All diagrams generated successfully.")
