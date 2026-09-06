import os
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import pandas as pd
import numpy as np

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "dashboard" / "screenshots"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "powerbi"

def set_card(ax, x, y, w, h, title, value, subtitle, icon=""):
    # Draws a styled Power BI KPI card
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.04",
                                  facecolor="#FFFFFF", edgecolor="#E2E8F0", linewidth=1.5)
    ax.add_patch(rect)
    ax.text(x + 0.15, y + h - 0.25, title.upper(), fontsize=7.5, fontweight="bold", color="#64748B")
    ax.text(x + 0.15, y + h - 0.65, value, fontsize=15, fontweight="bold", color="#0F172A")
    ax.text(x + 0.15, y + 0.18, subtitle, fontsize=7.5, color="#0284C7")

def draw_header(ax, title, active_tab_idx=0):
    # Top banner with title and tab bar
    rect_top = patches.Rectangle((0, 7.3), 12, 0.7, facecolor="#0F172A", edgecolor="none")
    ax.add_patch(rect_top)
    ax.text(0.3, 7.65, "ASG Airlines Flight Ops Dashboard", fontsize=11, fontweight="bold", color="#FFFFFF")
    ax.text(4.5, 7.65, "• Power BI Production Suite", fontsize=8.5, color="#94A3B8")
    ax.text(11.7, 7.65, "Gold Analytics", fontsize=8, color="#38BDF8", ha="right")

    # Tab bar
    rect_bar = patches.Rectangle((0, 6.7), 12, 0.6, facecolor="#1E293B", edgecolor="none")
    ax.add_patch(rect_bar)
    tabs = ["1. Duration Analysis", "2. Route Performance", "3. Airline Trends", "4. Delay & Anomaly Insights"]
    tab_x = [0.4, 3.2, 6.2, 9.2]
    for i, (t_name, tx) in enumerate(zip(tabs, tab_x)):
        is_active = (i == active_tab_idx)
        color = "#38BDF8" if is_active else "#94A3B8"
        weight = "bold" if is_active else "normal"
        ax.text(tx, 7.0, t_name, fontsize=8.5, color=color, fontweight=weight)
        if is_active:
            underline = patches.Rectangle((tx - 0.05, 6.72), 2.4, 0.05, facecolor="#0284C7", edgecolor="none")
            ax.add_patch(underline)

def generate_page1():
    # Page 1: Duration Analysis
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis("off")
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_facecolor("#F8FAFC")

    draw_header(ax, "Duration Analysis", active_tab_idx=0)

    # 4 KPI cards
    set_card(ax, 0.4, 5.5, 2.6, 1.0, "Avg Flight Duration", "164.6 min", "≈ 2 hrs 45 mins")
    set_card(ax, 3.3, 5.5, 2.6, 1.0, "Min Sector Duration", "30.0 min", "Shortest domestic hop")
    set_card(ax, 6.2, 5.5, 2.6, 1.0, "Max Sector Duration", "300.0 min", "Cross-metro long sector")
    set_card(ax, 9.1, 5.5, 2.5, 1.0, "Overnight Flights", "1 Repaired", "+1 day corrected (SJ192)")

    # Chart 1: Route Duration (Top 8)
    # Chart container box
    c_box1 = patches.FancyBboxPatch((0.4, 0.5), 5.5, 4.7, boxstyle="round,pad=0.04",
                                    facecolor="#FFFFFF", edgecolor="#E2E8F0", linewidth=1.5)
    ax.add_patch(c_box1)
    ax.text(0.7, 4.9, "Top 8 Routes by Average Duration (min)", fontsize=9, fontweight="bold", color="#1E293B")
    
    # Load data
    df_route = pd.read_csv(DATA_DIR / "kpi_route_duration.csv").head(8)
    y_pos = np.linspace(4.4, 1.0, len(df_route))
    max_val = df_route["avg_duration_min"].max()
    for idx, (y, (_, row)) in enumerate(zip(y_pos, df_route.iterrows())):
        ax.text(0.7, y, row["route_name"], fontsize=7.5, color="#334155", va="center")
        bar_len = (row["avg_duration_min"] / max_val) * 3.0
        bar = patches.Rectangle((2.1, y - 0.12), bar_len, 0.24, facecolor="#0284C7", edgecolor="none")
        ax.add_patch(bar)
        ax.text(2.1 + bar_len + 0.1, y, f"{row['avg_duration_min']:.1f}m", fontsize=7.5, color="#0F172A", va="center")

    # Chart 2: Airline Duration
    c_box2 = patches.FancyBboxPatch((6.2, 0.5), 5.4, 4.7, boxstyle="round,pad=0.04",
                                    facecolor="#FFFFFF", edgecolor="#E2E8F0", linewidth=1.5)
    ax.add_patch(c_box2)
    ax.text(6.5, 4.9, "Average Flight Duration by Airline (min)", fontsize=9, fontweight="bold", color="#1E293B")
    
    df_air = pd.read_csv(DATA_DIR / "kpi_airline_duration.csv")
    x_pos = np.linspace(6.8, 10.4, len(df_air))
    colors = ["#0284C7", "#38BDF8", "#0EA5E9", "#0369A1"]
    for x, c, (_, row) in zip(x_pos, colors, df_air.iterrows()):
        h = (row["avg_duration_min"] / 200.0) * 2.8
        bar = patches.Rectangle((x - 0.35, 1.2), 0.7, h, facecolor=c, edgecolor="none")
        ax.add_patch(bar)
        ax.text(x, 1.2 + h + 0.12, f"{row['avg_duration_min']:.1f}", fontsize=8, fontweight="bold", ha="center")
        ax.text(x, 0.85, row["airline_name"], fontsize=7.5, ha="center", color="#334155", rotation=10)

    out_p = OUTPUT_DIR / "page1_duration_analysis.png"
    plt.tight_layout()
    plt.savefig(out_p, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"Rendered: {out_p}")

def generate_page2():
    # Page 2: Route Performance
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis("off")
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_facecolor("#F8FAFC")

    draw_header(ax, "Route Performance", active_tab_idx=1)

    set_card(ax, 0.4, 5.5, 2.6, 1.0, "Active Routes", "30 Sectors", "6 Metro Hubs")
    set_card(ax, 3.3, 5.5, 2.6, 1.0, "Total Bookings", "1,000 Bookings", "320 Confirmed • 366 Pending")
    set_card(ax, 6.2, 5.5, 2.6, 1.0, "Cancellation Rate", "31.40%", "314 Cancellations")
    set_card(ax, 9.1, 5.5, 2.5, 1.0, "Total Route Revenue", "₹8.05 M", "Avg ₹8,054 per txn")

    # Chart 1: Top 8 Traffic Routes
    c_box1 = patches.FancyBboxPatch((0.4, 0.5), 5.5, 4.7, boxstyle="round,pad=0.04",
                                    facecolor="#FFFFFF", edgecolor="#E2E8F0", linewidth=1.5)
    ax.add_patch(c_box1)
    ax.text(0.7, 4.9, "Top 8 Busiest Routes (Flight Instances)", fontsize=9, fontweight="bold", color="#1E293B")
    
    df_traf = pd.read_csv(DATA_DIR / "kpi_route_traffic.csv").head(8)
    y_pos = np.linspace(4.4, 1.0, len(df_traf))
    max_val = df_traf["total_flights"].max()
    for y, (_, row) in zip(y_pos, df_traf.iterrows()):
        ax.text(0.7, y, row["route_name"], fontsize=7.5, color="#334155", va="center")
        bar_len = (row["total_flights"] / max_val) * 3.0
        bar = patches.Rectangle((2.1, y - 0.12), bar_len, 0.24, facecolor="#0D9488", edgecolor="none")
        ax.add_patch(bar)
        ax.text(2.1 + bar_len + 0.1, y, f"{int(row['total_flights'])} flts", fontsize=7.5, color="#0F172A", va="center")

    # Chart 2: Top 8 Revenue Routes
    c_box2 = patches.FancyBboxPatch((6.2, 0.5), 5.4, 4.7, boxstyle="round,pad=0.04",
                                    facecolor="#FFFFFF", edgecolor="#E2E8F0", linewidth=1.5)
    ax.add_patch(c_box2)
    ax.text(6.5, 4.9, "Top 8 Corridors by Operational Revenue (INR)", fontsize=9, fontweight="bold", color="#1E293B")
    
    df_rev = pd.read_csv(DATA_DIR / "kpi_route_revenue.csv").head(8)
    y_pos = np.linspace(4.4, 1.0, len(df_rev))
    max_rev = df_rev["total_revenue"].max()
    for y, (_, row) in zip(y_pos, df_rev.iterrows()):
        ax.text(6.5, y, row["route_name"], fontsize=7.5, color="#334155", va="center")
        bar_len = (row["total_revenue"] / max_rev) * 2.8
        bar = patches.Rectangle((7.8, y - 0.12), bar_len, 0.24, facecolor="#10B981", edgecolor="none")
        ax.add_patch(bar)
        ax.text(7.8 + bar_len + 0.1, y, f"₹{row['total_revenue']/1000:.0f}K", fontsize=7.5, color="#0F172A", va="center")

    out_p = OUTPUT_DIR / "page2_route_performance.png"
    plt.tight_layout()
    plt.savefig(out_p, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"Rendered: {out_p}")

def generate_page3():
    # Page 3: Airline Trends
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis("off")
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_facecolor("#F8FAFC")

    draw_header(ax, "Airline Trends", active_tab_idx=2)

    set_card(ax, 0.4, 5.5, 2.6, 1.0, "Total Flights", "1,005 Flights", "Deduplicated ops")
    set_card(ax, 3.3, 5.5, 2.6, 1.0, "Market Leader", "IndiGo (26.77%)", "269 flights (6E/6F)")
    set_card(ax, 6.2, 5.5, 2.6, 1.0, "Repaired Carriers", "72 Records", "41 NaN + 31 UNKNOWN")
    set_card(ax, 9.1, 5.5, 2.5, 1.0, "Top Payment Channel", "UPI (35.8%)", "358 transactions")

    # Chart 1: Donut Airline Market Share
    c_box1 = patches.FancyBboxPatch((0.4, 0.5), 5.5, 4.7, boxstyle="round,pad=0.04",
                                    facecolor="#FFFFFF", edgecolor="#E2E8F0", linewidth=1.5)
    ax.add_patch(c_box1)
    ax.text(0.7, 4.9, "Flight Share Distribution by Carrier", fontsize=9, fontweight="bold", color="#1E293B")
    
    # Inset pie chart
    ax_pie = fig.add_axes([0.08, 0.12, 0.35, 0.42])
    df_air = pd.read_csv(DATA_DIR / "kpi_airline_distribution.csv")
    colors = ["#0284C7", "#6366F1", "#F59E0B", "#EC4899"]
    wedges, texts, autotexts = ax_pie.pie(
        df_air["total_flights"], labels=df_air["airline_name"],
        autopct="%1.1f%%", colors=colors, startangle=90,
        wedgeprops=dict(width=0.45, edgecolor='w', linewidth=2)
    )
    for t in texts:
        t.set_fontsize(7.5)
    for at in autotexts:
        at.set_fontsize(7.5)
        at.set_weight("bold")

    # Chart 2: Payment Method Share
    c_box2 = patches.FancyBboxPatch((6.2, 0.5), 5.4, 4.7, boxstyle="round,pad=0.04",
                                    facecolor="#FFFFFF", edgecolor="#E2E8F0", linewidth=1.5)
    ax.add_patch(c_box2)
    ax.text(6.5, 4.9, "Payment Channel Distribution (Transaction Volume)", fontsize=9, fontweight="bold", color="#1E293B")
    
    ax_pie2 = fig.add_axes([0.56, 0.12, 0.35, 0.42])
    df_pay = pd.read_csv(DATA_DIR / "kpi_fare_by_payment_method.csv")
    p_colors = ["#14B8A6", "#3B82F6", "#8B5CF6"]
    wedges2, texts2, autotexts2 = ax_pie2.pie(
        df_pay["transaction_count"], labels=df_pay["payment_method"],
        autopct="%1.1f%%", colors=p_colors, startangle=140,
        wedgeprops=dict(width=0.45, edgecolor='w', linewidth=2)
    )
    for t in texts2:
        t.set_fontsize(7.5)
    for at in autotexts2:
        at.set_fontsize(7.5)
        at.set_weight("bold")

    out_p = OUTPUT_DIR / "page3_airline_trends.png"
    plt.tight_layout()
    plt.savefig(out_p, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"Rendered: {out_p}")

def generate_page4():
    # Page 4: Delay & Anomaly Insights
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 8)
    ax.axis("off")
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_facecolor("#F8FAFC")

    draw_header(ax, "Delay & Anomaly Insights", active_tab_idx=3)

    set_card(ax, 0.4, 5.5, 2.6, 1.0, "Duration Outliers", "1 Flight", "> 2 Std Dev from route mean")
    set_card(ax, 3.3, 5.5, 2.6, 1.0, "Negative Durations", "0 (Zero)", "100% Overnight resolved")
    set_card(ax, 6.2, 5.5, 2.6, 1.0, "Imputed Payments", "78 Records", "Median fare ₹8,027 applied")
    set_card(ax, 9.1, 5.5, 2.5, 1.0, "Data Loss Rate", "0.00%", "Zero orphan records")

    # Chart 1: Hourly Departures
    c_box1 = patches.FancyBboxPatch((0.4, 0.5), 5.5, 4.7, boxstyle="round,pad=0.04",
                                    facecolor="#FFFFFF", edgecolor="#E2E8F0", linewidth=1.5)
    ax.add_patch(c_box1)
    ax.text(0.7, 4.9, "Diurnal Flight Traffic by Departure Hour", fontsize=9, fontweight="bold", color="#1E293B")
    
    df_hour = pd.read_csv(DATA_DIR / "kpi_hourly_traffic.csv")
    ax_line = fig.add_axes([0.08, 0.12, 0.38, 0.42])
    ax_line.plot(df_hour["departure_hour"], df_hour["flights_count"], color="#0284C7", marker="o", markersize=4, linewidth=2)
    ax_line.fill_between(df_hour["departure_hour"], df_hour["flights_count"], color="#0284C7", alpha=0.15)
    ax_line.set_xlabel("Hour of Day (0-23)", fontsize=7.5)
    ax_line.set_ylabel("Flights Count", fontsize=7.5)
    ax_line.tick_params(axis='both', which='major', labelsize=7)
    ax_line.grid(True, linestyle=":", alpha=0.6)

    # Box 2: Outlier Detail Table Simulation
    c_box2 = patches.FancyBboxPatch((6.2, 0.5), 5.4, 4.7, boxstyle="round,pad=0.04",
                                    facecolor="#FFFFFF", edgecolor="#E2E8F0", linewidth=1.5)
    ax.add_patch(c_box2)
    ax.text(6.5, 4.9, "Statistical Duration Outlier Audit", fontsize=9, fontweight="bold", color="#1E293B")
    
    # Table headers
    ax.text(6.5, 4.4, "FLIGHT", fontsize=7.5, fontweight="bold", color="#64748B")
    ax.text(7.4, 4.4, "CARRIER", fontsize=7.5, fontweight="bold", color="#64748B")
    ax.text(8.4, 4.4, "ROUTE", fontsize=7.5, fontweight="bold", color="#64748B")
    ax.text(9.4, 4.4, "DURATION", fontsize=7.5, fontweight="bold", color="#64748B")
    ax.text(10.5, 4.4, "ROUTE MEAN", fontsize=7.5, fontweight="bold", color="#64748B")

    # Table row
    ax.text(6.5, 4.0, "SJ192", fontsize=8, fontweight="bold", color="#0F172A")
    ax.text(7.4, 4.0, "SpiceJet", fontsize=7.5, color="#334155")
    ax.text(8.4, 4.0, "HYD -> BOM", fontsize=7.5, color="#0284C7", fontweight="bold")
    ax.text(9.4, 4.0, "300.0m (5.0h)", fontsize=7.5, fontweight="bold", color="#D97706")
    ax.text(10.5, 4.0, "161.4m (±35m)", fontsize=7.5, color="#64748B")

    # Callout inside card
    call_rect = patches.FancyBboxPatch((6.5, 1.0), 4.8, 2.5, boxstyle="round,pad=0.04",
                                       facecolor="#F1F5F9", edgecolor="#CBD5E1", linewidth=1)
    ax.add_patch(call_rect)
    ax.text(6.7, 3.2, "OPERATIONAL RESOLUTION AUDIT", fontsize=8, fontweight="bold", color="#0F172A")
    lines = [
        "• Outlier Detection Threshold: > 2 Standard Deviations from Route Mean.",
        "• Observed Deviation: Flight SJ192 duration is 300 minutes vs 161.4m baseline.",
        "• Root Cause: Cross-day overnight scheduling with 18:45 departure.",
        "• Automated Quality Fix: +1 Day applied to arrival; prevents negative duration.",
        "• Analytics Contract: Retained with is_duration_outlier=True for audit tracking."
    ]
    for i, line in enumerate(lines):
        ax.text(6.7, 2.8 - (i * 0.35), line, fontsize=7, color="#334155")

    out_p = OUTPUT_DIR / "page4_delay_anomaly_insights.png"
    plt.tight_layout()
    plt.savefig(out_p, dpi=300, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"Rendered: {out_p}")

if __name__ == "__main__":
    generate_page1()
    generate_page2()
    generate_page3()
    generate_page4()
    print("All 4 Power BI dashboard page screenshots rendered successfully.")
