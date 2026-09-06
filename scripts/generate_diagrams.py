"""
Professional high-end diagram generator for ASG Airlines data engineering portfolio.
Produces publication-quality 300 DPI PNG assets.
"""
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "reports" / "assets"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Brand palette
NAVY    = "#0F2044"
BLUE1   = "#1A56A5"
BLUE2   = "#2B7FE0"
SKY     = "#38BDF8"
TEAL    = "#0D9488"
EMERALD = "#059669"
AMBER   = "#D97706"
ROSE    = "#E11D48"
SLATE   = "#334155"
LIGHT   = "#F1F5F9"
WHITE   = "#FFFFFF"
GREY    = "#94A3B8"
DARK    = "#0F172A"


def shadow_box(ax, x, y, w, h, fc, ec, radius=0.3, lw=1.8, alpha_shadow=0.12):
    """Draw a rounded box with a soft drop shadow."""
    # Shadow
    shadow = FancyBboxPatch((x + 0.07, y - 0.07), w, h,
                            boxstyle=f"round,pad=0.05,rounding_size={radius}",
                            facecolor="#000000", edgecolor="none",
                            alpha=alpha_shadow, zorder=1)
    ax.add_patch(shadow)
    # Main box
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle=f"round,pad=0.05,rounding_size={radius}",
                         facecolor=fc, edgecolor=ec, linewidth=lw, zorder=2)
    ax.add_patch(box)
    return box


def gradient_bar(ax, x, y, width, height, color1, color2, zorder=3):
    """Simulate gradient by drawing narrow rectangles blending from color1 to color2."""
    n = 60
    r1, g1, b1 = tuple(int(color1[i:i+2], 16)/255 for i in (1,3,5))
    r2, g2, b2 = tuple(int(color2[i:i+2], 16)/255 for i in (1,3,5))
    step_h = height / n
    for i in range(n):
        t = i / n
        r = r1 + (r2-r1)*t
        g = g1 + (g2-g1)*t
        b = b1 + (b2-b1)*t
        rect = plt.Rectangle((x, y + i*step_h), width, step_h+0.002,
                              facecolor=(r,g,b), edgecolor="none", zorder=zorder)
        ax.add_patch(rect)


def generate_architecture_diagram():
    fig = plt.figure(figsize=(18, 9), dpi=300)
    fig.patch.set_facecolor(DARK)

    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 9)
    ax.set_facecolor(DARK)
    ax.axis("off")

    # ── Background grid dots ──────────────────────────────────────────────────
    for gx in np.arange(0.5, 18, 0.9):
        for gy in np.arange(0.5, 9, 0.9):
            ax.plot(gx, gy, ".", color="#1E293B", markersize=2, zorder=0)

    # ── Title ─────────────────────────────────────────────────────────────────
    ax.text(9, 8.55, "ASG Airlines  •  Data Engineering Medallion Architecture",
            ha="center", va="center", fontsize=15, fontweight="bold",
            color=WHITE, fontfamily="DejaVu Sans", zorder=5)
    ax.text(9, 8.18, "Production Pipeline  •  Bronze → Silver → Gold → Consumption",
            ha="center", va="center", fontsize=9, color=GREY, zorder=5)

    # ── Four layers ──────────────────────────────────────────────────────────
    layers = [
        # (x, y, w, h, accent, label, sub, icon, items)
        (0.5, 0.7, 3.7, 7.0, "#B45309", "BRONZE", "Raw Ingestion", "⬡",
         ["UseCase - Airlines.xlsx", "flights (1,020 rows)", "bookings (1,000 rows)",
          "passengers (1,039 rows)", "payments (1,000 rows)", "",
          "Schema Validation", "PK Null Checks", "Quarantine Tracking", "Parquet Snapshots"]),
        (4.7, 0.7, 3.7, 7.0, "#0369A1", "SILVER", "Transformation", "⬡",
         ["Flight ID Regex Repair", "Airline Prefix Recovery", "Overnight +1 Day Fix",
          "Duration Recomputation", "Timestamp Normalisation", "",
          "Deduplication Logic", "SHA-256 PII Hashing", "Isolated PII Vault", "Audit Flag Columns"]),
        (8.9, 0.7, 3.7, 7.0, "#065F46", "GOLD", "Dimensional Model", "⬡",
         ["fact_flights (1,005 rows)", "fact_bookings (1,000 rows)", "fact_payments (1,000 rows)",
          "dim_airline  (4 rows)", "dim_route  (30 rows)", "",
          "11 KPI Aggregations", "Outlier Detection (±2σ)", "Age Band Cohorts", "Revenue Analytics"]),
        (13.1, 0.7, 4.4, 7.0, "#4C1D95", "CONSUMPTION", "Reporting & BI", "⬡",
         ["Power BI Report (.pbit)", "4-Page Executive Suite", "Interactive Slicers",
          "16 DAX Measures", "Parquet + CSV Exports", "",
          "HTML Dashboard App", "Architecture Diagrams", "Technical Docx (2 MB)", "Jupyter Walkthrough"]),
    ]

    for lx, ly, lw, lh, acc, label, sub, icon, items in layers:
        # Background card (slightly lighter dark)
        bg = FancyBboxPatch((lx, ly), lw, lh,
                            boxstyle="round,pad=0.15,rounding_size=0.4",
                            facecolor="#111827", edgecolor=acc, linewidth=2.2, zorder=2)
        ax.add_patch(bg)

        # Top accent strip
        gradient_bar(ax, lx+0.14, ly+lh-1.05, lw-0.28, 0.9, acc, "#000000", zorder=3)
        acc_cover = FancyBboxPatch((lx+0.14, ly+lh-1.05), lw-0.28, 0.9,
                                   boxstyle="round,pad=0,rounding_size=0.1",
                                   facecolor="none", edgecolor="none",
                                   alpha=0.0, zorder=3)
        ax.add_patch(acc_cover)

        # Layer label
        ax.text(lx + lw/2, ly+lh-0.57, label,
                ha="center", va="center", fontsize=13, fontweight="bold",
                color=WHITE, zorder=5)
        ax.text(lx + lw/2, ly+lh-0.90, sub,
                ha="center", va="center", fontsize=8, color=SKY, zorder=5,
                fontstyle="italic")

        # Divider line
        ax.plot([lx+0.25, lx+lw-0.25], [ly+lh-1.1, ly+lh-1.1],
                color=acc, linewidth=0.8, alpha=0.6, zorder=4)

        # Items
        section2_start = next((i for i, v in enumerate(items) if v == ""), len(items))
        for i, item in enumerate(items):
            if item == "":
                ax.plot([lx+0.3, lx+lw-0.3], [ly+lh-1.3-(i*0.46), ly+lh-1.3-(i*0.46)],
                        color="#1E293B", linewidth=0.7, zorder=4)
                continue
            is_section2 = i > section2_start
            dot_color = acc if not is_section2 else SKY
            text_color = "#CBD5E1" if not is_section2 else "#94A3B8"
            ax.text(lx+0.38, ly+lh-1.25-(i*0.46), "•",
                    fontsize=9, color=dot_color, zorder=5, va="center")
            ax.text(lx+0.55, ly+lh-1.26-(i*0.46), item,
                    fontsize=7.5, color=text_color, va="center", zorder=5)

    # ── Connector arrows ──────────────────────────────────────────────────────
    arrow_y = 4.2
    arrow_style = dict(arrowstyle="-|>", color=SKY, lw=2.5,
                       mutation_scale=20, zorder=6)
    for ax_start, ax_end in [(4.2, 4.7), (8.4, 8.9), (12.6, 13.1)]:
        ax.annotate("",
                    xy=(ax_end, arrow_y), xytext=(ax_start, arrow_y),
                    arrowprops=arrow_style)
        label_map = {4.7: "Validate\n& Snapshot", 8.9: "Clean\n& Mask", 13.1: "Model\n& Aggregate"}
        ax.text((ax_start + ax_end)/2, arrow_y + 0.45, label_map[ax_end],
                ha="center", fontsize=6.5, color=GREY, zorder=7)

    # ── Vault callout ─────────────────────────────────────────────────────────
    vault_box = FancyBboxPatch((5.0, 0.08), 3.1, 0.52,
                               boxstyle="round,pad=0.06,rounding_size=0.1",
                               facecolor="#1C1C2E", edgecolor=AMBER, linewidth=1.2, zorder=4)
    ax.add_patch(vault_box)
    ax.text(6.55, 0.34, "[VAULT]  Restricted PII Vault  -  data/secure/pii_vault.parquet  (SHA-256 Salted)",
            ha="center", va="center", fontsize=7.5, color=AMBER, zorder=5)
    ax.annotate("", xy=(6.55, 0.6), xytext=(6.55, 0.72),
                arrowprops=dict(arrowstyle="-|>", color=AMBER, lw=1.2,
                                mutation_scale=10, zorder=6))

    # ── Bottom caption ────────────────────────────────────────────────────────
    ax.text(9, 0.35, "Idempotent Pipeline  •  Execution: ~1 sec  •  Zero Data Loss  •  100% Referential Integrity",
            ha="center", va="center", fontsize=8, color=GREY, zorder=5)

    out_path = OUTPUT_DIR / "architecture_diagram.png"
    plt.savefig(out_path, dpi=300, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"Architecture diagram: {out_path}")


def generate_star_schema_diagram():
    fig = plt.figure(figsize=(18, 11), dpi=300)
    fig.patch.set_facecolor("#0D1117")

    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 11)
    ax.set_facecolor("#0D1117")
    ax.axis("off")

    # Grid
    for gx in np.arange(0.4, 18, 0.8):
        for gy in np.arange(0.4, 11, 0.8):
            ax.plot(gx, gy, ".", color="#161B22", markersize=2.5, zorder=0)

    # Title
    ax.text(9, 10.55, "ASG Airlines Gold Layer — Star Schema Data Model",
            ha="center", va="center", fontsize=16, fontweight="bold", color=WHITE)
    ax.text(9, 10.18, "Surrogate Keys  •  Masked PII Dimensions  •  Analytical Facts  •  Power BI Ready",
            ha="center", va="center", fontsize=9, color=GREY)

    # ── Table renderer ─────────────────────────────────────────────────────────
    def draw_table(x, y, w, h, title, pk_col, fk_cols, attr_cols, accent, is_fact=False):
        # Card
        bg = FancyBboxPatch((x, y), w, h,
                            boxstyle="round,pad=0.1,rounding_size=0.3",
                            facecolor="#161B22", edgecolor=accent, linewidth=2.5, zorder=2)
        ax.add_patch(bg)

        # Header gradient strip
        header_h = 0.55
        gradient_bar(ax, x+0.12, y+h-header_h-0.07, w-0.24, header_h, accent, "#000000", zorder=3)
        ax.text(x + w/2, y+h-header_h/2-0.07, title,
                ha="center", va="center", fontsize=10.5, fontweight="bold", color=WHITE, zorder=5)

        row_h = 0.34
        y_cur = y + h - header_h - 0.12

        # PK row
        pk_bg = FancyBboxPatch((x+0.1, y_cur-row_h), w-0.2, row_h-0.04,
                               boxstyle="square,pad=0", facecolor="#1C2A1C", edgecolor="none", zorder=3)
        ax.add_patch(pk_bg)
        ax.text(x+0.22, y_cur-row_h/2, "[PK]", fontsize=6, color="#4ADE80", va="center",
                fontfamily="monospace", fontweight="bold", zorder=5)
        ax.text(x+0.50, y_cur-row_h/2, pk_col, fontsize=8, color="#4ADE80", va="center",
                fontfamily="monospace", zorder=5)
        ax.text(x+w-0.15, y_cur-row_h/2, "PK", fontsize=6.5, color="#4ADE80", va="center",
                ha="right", fontweight="bold", zorder=5)
        y_cur -= row_h

        # FK rows
        for fk in fk_cols:
            fk_bg = FancyBboxPatch((x+0.1, y_cur-row_h), w-0.2, row_h-0.04,
                                   boxstyle="square,pad=0", facecolor="#1A2030", edgecolor="none", zorder=3)
            ax.add_patch(fk_bg)
            ax.text(x+0.22, y_cur-row_h/2, "[FK]", fontsize=6, color="#60A5FA", va="center",
                    fontfamily="monospace", fontweight="bold", zorder=5)
            ax.text(x+0.50, y_cur-row_h/2, fk, fontsize=7.5, color="#60A5FA", va="center",
                    fontfamily="monospace", zorder=5)
            ax.text(x+w-0.15, y_cur-row_h/2, "FK", fontsize=6, color="#60A5FA", va="center",
                    ha="right", fontweight="bold", zorder=5)
            y_cur -= row_h

        # Divider
        ax.plot([x+0.2, x+w-0.2], [y_cur+0.02, y_cur+0.02],
                color="#1E3A5F", linewidth=0.8, zorder=4)

        # Attribute rows
        for attr in attr_cols:
            ax.text(x+0.44, y_cur-row_h/2, attr, fontsize=7.2, color="#CBD5E1",
                    va="center", fontfamily="monospace", zorder=5)
            y_cur -= row_h

    # ── FACTS (centre) ─────────────────────────────────────────────────────────
    draw_table(6.2, 6.5, 5.6, 3.6, "FACT_FLIGHTS",
               "flight_instance_id : INT",
               ["airline_key : INT  →  dim_airline",
                "route_key : INT  →  dim_route",
                "departure_date_key : INT  →  dim_date"],
               ["departure_time  :  DATETIME",
                "duration_minutes  :  FLOAT",
                "is_overnight  :  BOOL",
                "is_duration_outlier  :  BOOL",
                "duration_anomaly_flag  :  BOOL"],
               BLUE2, is_fact=True)

    draw_table(6.2, 2.8, 5.6, 3.2, "FACT_BOOKINGS  +  FACT_PAYMENTS",
               "booking_id / payment_id : STRING",
               ["passenger_key : INT  →  dim_passenger",
                "flight_id : STRING  →  fact_flights",
                "route_key / airline_key : INT"],
               ["status  :  CONFIRMED | CANCELLED | PENDING",
                "amount  :  FLOAT  (INR)",
                "payment_method  :  UPI | CARD | NETBANKING",
                "is_amount_imputed  :  BOOL"],
               BLUE2, is_fact=True)

    # ── DIMENSIONS ─────────────────────────────────────────────────────────────
    draw_table(0.4, 7.5, 5.2, 2.7, "DIM_AIRLINE",
               "airline_key : INT",
               [],
               ["airline_name  :  STRING (Air India / IndiGo…)",
                "airline_code  :  STRING (AI | 6E | SJ | UK)",
                "country  :  STRING"],
               EMERALD)

    draw_table(0.4, 3.5, 5.2, 3.4, "DIM_ROUTE",
               "route_key : INT",
               [],
               ["source  :  STRING (IATA code)",
                "source_city  :  STRING",
                "destination  :  STRING (IATA code)",
                "dest_city  :  STRING",
                "route_name  :  e.g. BOM -> DEL",
                "route_full_name  :  Mumbai to Delhi"],
               EMERALD)

    draw_table(12.4, 7.5, 5.2, 2.7, "DIM_DATE",
               "date_key : INT (YYYYMMDD)",
               [],
               ["full_date  :  DATE",
                "year / month / day  :  INT",
                "month_name / day_name  :  STRING",
                "is_weekend  :  BOOL"],
               TEAL)

    draw_table(12.4, 3.5, 5.2, 3.4, "DIM_PASSENGER",
               "passenger_key : INT",
               [],
               ["passenger_id  :  STRING (BK)",
                "gender  :  M | F",
                "age / age_band  :  INT / STRING",
                "email_masked  :  i***@domain.com",
                "phone_masked  :  +91-XXXXX-XX##",
                "aadhaar_masked  :  XXXX-XXXX-####"],
               TEAL)

    # ── CONNECTOR LINES ────────────────────────────────────────────────────────
    conn_style = dict(lw=1.6, color="#374151", linestyle="--", zorder=1)
    label_kw = dict(fontsize=7.5, color="#6B7280", ha="center", va="center", zorder=4)
    # dim_airline -> fact_flights
    ax.annotate("", xy=(6.2, 8.35), xytext=(5.6, 8.35),
                arrowprops=dict(arrowstyle="-|>", color="#374151", lw=1.5, mutation_scale=12))
    ax.text(5.9, 8.65, "1:N", **label_kw)
    # dim_route -> fact_flights
    ax.annotate("", xy=(6.2, 7.2), xytext=(5.6, 6.2),
                arrowprops=dict(arrowstyle="-|>", color="#374151", lw=1.5, mutation_scale=12))
    ax.text(5.7, 6.8, "1:N", **label_kw)
    # dim_date -> fact_flights
    ax.annotate("", xy=(11.8, 8.35), xytext=(12.4, 8.35),
                arrowprops=dict(arrowstyle="-|>", color="#374151", lw=1.5, mutation_scale=12))
    ax.text(12.1, 8.65, "N:1", **label_kw)
    # dim_passenger -> fact_bookings
    ax.annotate("", xy=(11.8, 4.8), xytext=(12.4, 4.8),
                arrowprops=dict(arrowstyle="-|>", color="#374151", lw=1.5, mutation_scale=12))
    ax.text(12.1, 5.1, "N:1", **label_kw)
    # dim_route -> fact_bookings
    ax.annotate("", xy=(6.2, 4.4), xytext=(5.6, 4.4),
                arrowprops=dict(arrowstyle="-|>", color="#374151", lw=1.5, mutation_scale=12))
    ax.text(5.7, 4.7, "1:N", **label_kw)
    # fact_flights -> fact_bookings
    ax.annotate("", xy=(9.0, 6.5), xytext=(9.0, 6.0),
                arrowprops=dict(arrowstyle="-|>", color="#374151", lw=1.5, mutation_scale=12))
    ax.text(9.5, 6.25, "1:N", **label_kw)

    # ── Legend ─────────────────────────────────────────────────────────────────
    legend_items = [
        (mpatches.Patch(color=BLUE2, label="Fact Table"), "Fact Table"),
        (mpatches.Patch(color=EMERALD, label="Dimension Table"), "Dimension (Source)"),
        (mpatches.Patch(color=TEAL, label="Dimension Table"), "Dimension (Passenger/Date)"),
    ]
    leg = ax.legend(handles=[mpatches.Patch(facecolor=BLUE2, label="Fact Table"),
                              mpatches.Patch(facecolor=EMERALD, label="Dimension (Route/Airline)"),
                              mpatches.Patch(facecolor=TEAL, label="Dimension (Date/Passenger)")],
                    loc="lower center", ncol=3, frameon=True,
                    facecolor="#161B22", edgecolor="#374151",
                    labelcolor=WHITE, fontsize=8.5,
                    bbox_to_anchor=(0.5, 0.01))

    ax.text(9, 2.4, "Star Schema — 100% Referential Integrity  •  Zero Orphan Records  •  Surrogate Keys Throughout",
            ha="center", fontsize=8, color=GREY)

    out_path = OUTPUT_DIR / "star_schema_model.png"
    plt.savefig(out_path, dpi=300, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"Star schema diagram: {out_path}")


def generate_data_flow_diagram():
    fig = plt.figure(figsize=(20, 8), dpi=300)
    fig.patch.set_facecolor("#060D1A")

    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 20)
    ax.set_ylim(0, 8)
    ax.set_facecolor("#060D1A")
    ax.axis("off")

    # Grid
    for gx in np.arange(0.5, 20, 1.0):
        for gy in np.arange(0.4, 8, 0.9):
            ax.plot(gx, gy, ".", color="#0D1526", markersize=2, zorder=0)

    ax.text(10, 7.6, "ASG Airlines  •  End-to-End Data Transformation Flow & Quality Gates",
            ha="center", fontsize=15, fontweight="bold", color=WHITE, zorder=5)
    ax.text(10, 7.22, "Data lineage from raw Excel source → cryptographic PII vault → analytical gold layer → executive Power BI",
            ha="center", fontsize=8.5, color=GREY, zorder=5)

    steps = [
        (0.5, 1.2, 3.0, 5.4, "#92400E", "#FBBF24",  # x y w h border accent
         "01", "SOURCE", "Excel Workbook",
         ["UseCase - Airlines.xlsx", "4 operational sheets", "~4,059 total raw rows",
          "Mixed data quality", "Undeclared PII"]),
        (4.1, 1.2, 3.0, 5.4, "#1E3A8A", "#60A5FA",
         "02", "BRONZE", "Ingestion & Validate",
         ["Schema column audit", "PK null quarantine", "Raw Parquet snapshot",
          "Row count logging", "Idempotent writes"]),
        (7.7, 1.2, 3.0, 5.4, "#5B21B6", "#A78BFA",
         "03", "SILVER", "Clean & Transform",
         ["Regex flight ID repair", "Overnight +24h fix", "SHA-256 PII hashing",
          "Deduplication score", "Ref. integrity flags"]),
        (11.3, 1.2, 3.0, 5.4, "#14532D", "#4ADE80",
         "04", "GOLD", "Model & Aggregate",
         ["Surrogate key gen.", "Star schema build", "11 KPI tables",
          "Outlier detection ±2σ", "Age band cohorts"]),
        (14.9, 1.2, 3.0, 5.4, "#831843", "#FB7185",
         "05", "POWERBI", "Export & Visualise",
         ["Parquet + CSV dual", "DAX 16 measures", "4-page BI dashboard",
          ".pbit template file", "Tech docs (2 MB)"]),
        (18.5, 1.2, 1.0, 5.4, "#0C4A6E", "#38BDF8",
         "∞", "LOOP", "Monitor",
         ["Audit log", "Row counts", "Alerts"]),
    ]

    step_boxes = []
    for sx, sy, sw, sh, border, accent, num, stage, title, items in steps:
        # Card
        bg = FancyBboxPatch((sx, sy), sw, sh,
                            boxstyle="round,pad=0.12,rounding_size=0.35",
                            facecolor="#0A111F", edgecolor=border, linewidth=2.0, zorder=2)
        ax.add_patch(bg)

        # Top step number
        circle = plt.Circle((sx + sw/2, sy+sh-0.42), 0.28,
                             facecolor=border, edgecolor=border, zorder=4)
        ax.add_patch(circle)
        ax.text(sx + sw/2, sy+sh-0.42, num,
                ha="center", va="center", fontsize=9, fontweight="bold",
                color=WHITE, zorder=5)

        # Stage label
        ax.text(sx + sw/2, sy+sh-0.92, stage,
                ha="center", va="center", fontsize=10.5, fontweight="bold",
                color=accent, zorder=5)
        ax.text(sx + sw/2, sy+sh-1.28, title,
                ha="center", va="center", fontsize=7.5, color="#94A3B8",
                fontstyle="italic", zorder=5)

        # Divider
        ax.plot([sx+0.18, sx+sw-0.18], [sy+sh-1.42, sy+sh-1.42],
                color=border, linewidth=0.7, alpha=0.5, zorder=4)

        # Items
        for i, item in enumerate(items):
            ax.text(sx+sw/2, sy+sh-1.70-(i*0.62), f"• {item}",
                    ha="center", va="center", fontsize=7.2, color="#CBD5E1", zorder=5)

        step_boxes.append((sx, sy, sw, sh))

    # Arrows between boxes
    for i in range(len(step_boxes)-1):
        x1, _, w1, _ = step_boxes[i]
        x2, _, _, _ = step_boxes[i+1]
        mid_y = 3.9
        # Arrow line
        ax.annotate("",
                    xy=(x2, mid_y), xytext=(x1+w1, mid_y),
                    arrowprops=dict(arrowstyle="-|>", color=SKY, lw=2.0,
                                   mutation_scale=18, zorder=6))

    # ── PII Vault callout ────────────────────────────────────────────────────
    vault = FancyBboxPatch((7.7, 0.12), 3.0, 0.88,
                           boxstyle="round,pad=0.08,rounding_size=0.2",
                           facecolor="#1C1407", edgecolor=AMBER, linewidth=1.5, zorder=4)
    ax.add_patch(vault)
    ax.text(9.2, 0.65, "[VAULT]  PII VAULT  -  data/secure/pii_vault.parquet",
            ha="center", va="center", fontsize=8.5, fontweight="bold", color=AMBER, zorder=5)
    ax.text(9.2, 0.30, "Restricted access  •  SHA-256 + salt  •  Aadhaar, Passport, Phone, DOB",
            ha="center", va="center", fontsize=7, color="#D97706", zorder=5)
    ax.annotate("", xy=(9.2, 1.2), xytext=(9.2, 1.0),
                arrowprops=dict(arrowstyle="-|>", color=AMBER, lw=1.3, mutation_scale=9, zorder=6))

    out_path = OUTPUT_DIR / "data_flow_diagram.png"
    plt.savefig(out_path, dpi=300, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    print(f"Data flow diagram: {out_path}")


if __name__ == "__main__":
    generate_architecture_diagram()
    generate_star_schema_diagram()
    generate_data_flow_diagram()
    print("All professional diagrams generated.")
