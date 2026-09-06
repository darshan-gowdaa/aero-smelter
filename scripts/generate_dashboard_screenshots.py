"""
High-end Power BI-style dashboard page screenshot generator.
4 full-page, 300 DPI analytics pages using real gold layer data.
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
from matplotlib.gridspec import GridSpec
from pathlib import Path

GOLD = Path(__file__).resolve().parent.parent / "data" / "gold"
OUT  = Path(__file__).resolve().parent.parent / "dashboard" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)

# Colour system
BG_DARK    = "#0D1117"
BG_CARD    = "#161B22"
BG_HEADER  = "#0A0F1A"
C_BORDER   = "#21262D"
C_ACCENT   = "#1F6FEB"
C_GREEN    = "#3FB950"
C_RED      = "#F85149"
C_AMBER    = "#D29922"
C_PURPLE   = "#BC8CFF"
C_TEAL     = "#39D353"
WHITE      = "#FFFFFF"
GREY1      = "#E6EDF3"
GREY2      = "#8B949E"
GREY3      = "#30363D"

# Data colour palettes
PAL_AIRLINE = ["#1F6FEB", "#3FB950", "#D29922", "#F85149"]
PAL_ROUTE   = ["#238636", "#1F6FEB", "#DA3633", "#8957E5",
               "#0B93A0", "#DD6B20", "#6E40C9", "#1A7F37",
               "#0969DA", "#CF222E"]

FIGW, FIGH = 22, 14


def card_bg(ax):
    ax.set_facecolor(BG_CARD)
    for spine in ax.spines.values():
        spine.set_edgecolor(C_BORDER)
        spine.set_linewidth(0.8)


def kpi_tile(fig, rect, value, label, delta=None, delta_good=True, accent=C_ACCENT):
    """Small KPI card using fig.add_axes(rect)."""
    ax = fig.add_axes(rect)
    ax.set_facecolor(BG_CARD)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    for spine in ax.spines.values():
        spine.set_edgecolor(C_BORDER)
    # Accent top bar
    ax.add_patch(plt.Rectangle((0, 0.88), 1, 0.12, facecolor=accent, zorder=2))
    ax.text(0.5, 0.94, label, ha="center", va="center", fontsize=8.5,
            color=WHITE, fontweight="bold", zorder=3)
    ax.text(0.5, 0.54, value, ha="center", va="center", fontsize=20,
            fontweight="bold", color=WHITE)
    if delta:
        col = C_GREEN if delta_good else C_RED
        sym = "+" if delta_good else ""
        ax.text(0.5, 0.22, f"{sym}{delta}", ha="center", va="center",
                fontsize=9, color=col)


def page_header(fig, page_num, title, subtitle):
    ax = fig.add_axes([0, 0.94, 1, 0.06])
    ax.set_facecolor(BG_HEADER)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    # Left — brand
    ax.text(0.012, 0.55, "ASG Airlines | Flight Operations Analytics", ha="left", va="center",
            fontsize=11, fontweight="bold", color=WHITE)
    ax.text(0.012, 0.15, "Medallion Gold Layer  •  pandas + PyArrow Pipeline", ha="left",
            va="center", fontsize=7.5, color=GREY2)
    # Centre — page title
    ax.text(0.5, 0.7, title, ha="center", va="center", fontsize=14,
            fontweight="bold", color=GREY1)
    ax.text(0.5, 0.18, subtitle, ha="center", va="center",
            fontsize=8, color=GREY2)
    # Right — page badge
    ax.text(0.97, 0.6, f"Page {page_num} / 4", ha="right", va="center",
            fontsize=9, color=GREY2)
    ax.text(0.97, 0.22, "ASG Airlines Analytics Suite", ha="right", va="center",
            fontsize=7.5, color=GREY2)
    # Separator line
    ax.axhline(0.02, color=C_BORDER, linewidth=0.8)


def page_footer(fig, note):
    ax = fig.add_axes([0, 0, 1, 0.03])
    ax.set_facecolor(BG_HEADER)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.text(0.5, 0.5, note, ha="center", va="center", fontsize=7.5, color=GREY2)
    ax.axhline(0.95, color=C_BORDER, linewidth=0.5)


# ─────────────────────────────────────────────────────────────────────────────
# PAGE 1: Duration Analysis
# ─────────────────────────────────────────────────────────────────────────────
def generate_page1():
    fact = pd.read_parquet(GOLD / "fact_flights.parquet")
    kpi_airline = pd.read_parquet(GOLD / "kpi_airline_duration.parquet")
    kpi_route = pd.read_parquet(GOLD / "kpi_route_duration.parquet").nlargest(10, "flight_count")
    kpi_hourly = pd.read_parquet(GOLD / "kpi_hourly_traffic.parquet").sort_values("departure_hour")
    dim_route = pd.read_parquet(GOLD / "dim_route.parquet")
    dim_airline = pd.read_parquet(GOLD / "dim_airline.parquet")

    fig = plt.figure(figsize=(FIGW, FIGH), dpi=300)
    fig.patch.set_facecolor(BG_DARK)

    page_header(fig, 1, "Duration Analysis & Flight Traffic",
                "Average flight durations, route breakdown, hourly traffic pattern, and overnight anomaly tracking")

    # KPI tiles (top row)
    kpi_data = [
        ("1,005", "Total Flights", "1,020 raw ingested", True, "#1F6FEB"),
        ("164.6 min", "Avg Duration", "2.74 hrs average", True, "#3FB950"),
        ("30 min", "Min Duration", "Shortest route", True, "#D29922"),
        ("300 min", "Max Duration", "SJ192 overnight", False, "#F85149"),
        ("1", "Overnight Repaired", "SJ192 HYD->BOM", True, "#BC8CFF"),
    ]
    tile_w = 0.165
    tile_h = 0.13
    tile_y = 0.79
    for i, (val, lbl, delta, good, acc) in enumerate(kpi_data):
        kpi_tile(fig, [0.02 + i*(tile_w+0.008), tile_y, tile_w, tile_h],
                 val, lbl, delta, good, acc)

    # Chart 1: Airline avg duration grouped bar with min/max range
    ax1 = fig.add_axes([0.02, 0.41, 0.44, 0.35])
    card_bg(ax1)
    airlines = kpi_airline["airline_name"].str.replace("Air India", "Air India").values
    short_names = [n.split()[0] if len(n.split()[0]) > 2 else n for n in airlines]
    x = np.arange(len(airlines))
    w = 0.25
    ax1.bar(x - w, kpi_airline["min_duration_min"], w, label="Min", color="#0D4A8C", alpha=0.9, zorder=3)
    ax1.bar(x, kpi_airline["avg_duration_min"], w, label="Avg", color=C_ACCENT, alpha=0.95, zorder=3)
    ax1.bar(x + w, kpi_airline["max_duration_min"], w, label="Max", color=C_RED, alpha=0.85, zorder=3)
    for i, (mn, avg, mx) in enumerate(zip(kpi_airline["min_duration_min"],
                                           kpi_airline["avg_duration_min"],
                                           kpi_airline["max_duration_min"])):
        ax1.text(i, avg + 3, f"{avg:.0f}", ha="center", fontsize=7.5, color=GREY1)
    ax1.set_xticks(x)
    ax1.set_xticklabels(short_names, fontsize=9, color=GREY1)
    ax1.set_ylabel("Duration (minutes)", color=GREY2, fontsize=8)
    ax1.tick_params(colors=GREY2, labelsize=8)
    ax1.set_title("Airline Duration Profile (Min / Avg / Max)", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax1.legend(fontsize=8, facecolor=BG_CARD, labelcolor=GREY1, framealpha=0.8)
    ax1.yaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.6)
    ax1.set_facecolor(BG_CARD)
    ax1.set_ylim(0, 340)

    # Chart 2: Route avg duration horizontal bar
    ax2 = fig.add_axes([0.52, 0.41, 0.46, 0.35])
    card_bg(ax2)
    kpi_route_sorted = kpi_route.sort_values("avg_duration_min")
    colors_r = [PAL_ROUTE[i % len(PAL_ROUTE)] for i in range(len(kpi_route_sorted))]
    bars = ax2.barh(kpi_route_sorted["route_name"], kpi_route_sorted["avg_duration_min"],
                    color=colors_r, alpha=0.92, height=0.65, zorder=3)
    ax2.set_xlabel("Avg Duration (min)", color=GREY2, fontsize=8)
    ax2.tick_params(colors=GREY2, labelsize=8)
    ax2.set_title("Top 10 Routes — Avg Flight Duration", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax2.xaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.6)
    ax2.set_facecolor(BG_CARD)
    for bar, val in zip(bars, kpi_route_sorted["avg_duration_min"]):
        ax2.text(bar.get_width() + 1.5, bar.get_y() + bar.get_height()/2,
                 f"{val:.0f}m", va="center", fontsize=7.5, color=GREY1)

    # Chart 3: Hourly traffic heatmap-style bar
    ax3 = fig.add_axes([0.02, 0.06, 0.57, 0.30])
    card_bg(ax3)
    hours = kpi_hourly["departure_hour"].values
    counts = kpi_hourly["flights_count"].values
    max_c = counts.max()
    bar_colors = [plt.cm.Blues(0.35 + 0.65 * (c / max_c)) for c in counts]
    ax3.bar(hours, counts, color=bar_colors, width=0.82, zorder=3)
    for h, c in zip(hours, counts):
        if c > 0:
            ax3.text(h, c + 0.3, str(c), ha="center", fontsize=6.5, color=GREY1)
    peak_h = hours[np.argmax(counts)]
    ax3.axvline(peak_h, color=C_AMBER, linewidth=1.2, linestyle="--", alpha=0.8, label=f"Peak: {peak_h}:00")
    ax3.set_xticks(hours)
    ax3.set_xticklabels([f"{h:02d}:00" for h in hours], fontsize=6.5,
                         rotation=45, color=GREY2, ha="right")
    ax3.set_ylabel("Flights", color=GREY2, fontsize=8)
    ax3.tick_params(colors=GREY2)
    ax3.set_title("Hourly Flight Traffic Distribution (24h)", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax3.yaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax3.legend(fontsize=8, facecolor=BG_CARD, labelcolor=GREY1)
    ax3.set_facecolor(BG_CARD)

    # Chart 4: Duration histogram
    ax4 = fig.add_axes([0.63, 0.06, 0.35, 0.30])
    card_bg(ax4)
    dur = fact["duration_minutes"].dropna()
    n, bins, patches = ax4.hist(dur, bins=20, color=C_ACCENT, alpha=0.85, edgecolor=BG_DARK, linewidth=0.4, zorder=3)
    # Colour by range
    for patch, left in zip(patches, bins[:-1]):
        if left < 60:
            patch.set_facecolor(C_GREEN)
        elif left > 240:
            patch.set_facecolor(C_RED)
    ax4.axvline(dur.mean(), color=C_AMBER, linewidth=1.5, linestyle="--",
                label=f"Mean: {dur.mean():.1f} min")
    ax4.set_xlabel("Duration (minutes)", color=GREY2, fontsize=8)
    ax4.set_ylabel("Frequency", color=GREY2, fontsize=8)
    ax4.tick_params(colors=GREY2, labelsize=8)
    ax4.set_title("Duration Frequency Distribution", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax4.yaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax4.legend(fontsize=8, facecolor=BG_CARD, labelcolor=GREY1)
    ax4.set_facecolor(BG_CARD)

    page_footer(fig, "Data Source: data/gold/fact_flights.parquet  |  kpi_airline_duration  |  kpi_route_duration  |  kpi_hourly_traffic")
    plt.savefig(OUT / "page1_duration_analysis.png", dpi=300, bbox_inches="tight",
                facecolor=BG_DARK)
    plt.close()
    print("Page 1 saved.")


# ─────────────────────────────────────────────────────────────────────────────
# PAGE 2: Route Performance
# ─────────────────────────────────────────────────────────────────────────────
def generate_page2():
    kpi_rev = pd.read_parquet(GOLD / "kpi_route_revenue.parquet").nlargest(10, "total_revenue")
    kpi_traffic = pd.read_parquet(GOLD / "kpi_route_traffic.parquet").nlargest(10, "total_flights")
    kpi_cancel = pd.read_parquet(GOLD / "kpi_route_cancellations.parquet").nlargest(8, "cancellation_rate_pct")
    kpi_age = pd.read_parquet(GOLD / "kpi_age_band_by_route.parquet")
    fact_b = pd.read_parquet(GOLD / "fact_bookings.parquet")

    total_rev = kpi_rev["total_revenue"].sum()
    avg_fare = kpi_rev["avg_fare"].mean()

    fig = plt.figure(figsize=(FIGW, FIGH), dpi=300)
    fig.patch.set_facecolor(BG_DARK)

    page_header(fig, 2, "Route Performance & Revenue Intelligence",
                "Top revenue routes, traffic share, cancellation risk matrix, and passenger cohort distribution")

    kpi_data = [
        ("30", "Active Routes", "Unique origin-dest pairs", True, "#1F6FEB"),
        (f"INR {total_rev/1e6:.2f}M", "Total Revenue", f"Across all routes", True, "#3FB950"),
        (f"INR {avg_fare:,.0f}", "Avg Fare", "Per transaction", True, "#D29922"),
        ("BOM->CCU", "Top Route", "By revenue", True, "#BC8CFF"),
        ("31.4%", "Cancellation Rate", "Industry watch", False, "#F85149"),
    ]
    tile_w = 0.165
    for i, (val, lbl, delta, good, acc) in enumerate(kpi_data):
        kpi_tile(fig, [0.02 + i*(tile_w+0.008), 0.79, tile_w, 0.13],
                 val, lbl, delta, good, acc)

    # Chart 1: Revenue horizontal bar
    ax1 = fig.add_axes([0.02, 0.41, 0.44, 0.35])
    card_bg(ax1)
    rev_sorted = kpi_rev.sort_values("total_revenue")
    grad_colors = plt.cm.Blues(np.linspace(0.4, 0.9, len(rev_sorted)))
    bars = ax1.barh(rev_sorted["route_name"], rev_sorted["total_revenue"] / 1000,
                    color=grad_colors, height=0.65, zorder=3)
    ax1.set_xlabel("Revenue (INR Thousands)", color=GREY2, fontsize=8)
    ax1.tick_params(colors=GREY2, labelsize=8)
    ax1.set_title("Top 10 Routes — Total Revenue (INR)", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax1.xaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    for bar, val, avg in zip(bars, rev_sorted["total_revenue"], rev_sorted["avg_fare"]):
        ax1.text(bar.get_width() + 1, bar.get_y() + bar.get_height()/2,
                 f"₹{val/1000:.1f}K  (avg ₹{avg:,.0f})", va="center", fontsize=6.8, color=GREY1)
    ax1.set_facecolor(BG_CARD)

    # Chart 2: Traffic share pie / donut
    ax2 = fig.add_axes([0.52, 0.41, 0.22, 0.35])
    card_bg(ax2)
    top5 = kpi_traffic.nlargest(5, "total_flights")
    others = kpi_traffic.iloc[5:]["total_flights"].sum()
    labels = list(top5["route_name"]) + ["Others"]
    sizes  = list(top5["total_flights"]) + [others]
    colors_pie = [*PAL_ROUTE[:5], GREY2]
    wedges, texts, autotexts = ax2.pie(sizes, labels=None, colors=colors_pie,
                                       autopct="%1.1f%%", startangle=120,
                                       wedgeprops=dict(width=0.6, edgecolor=BG_DARK, linewidth=1.5),
                                       pctdistance=0.82, textprops={"fontsize": 7.5, "color": WHITE})
    for wt in autotexts:
        wt.set_fontsize(7)
    ax2.set_title("Traffic Share\n(Top Routes)", color=GREY1,
                  fontsize=9, fontweight="bold")
    ax2.legend(labels, fontsize=7, facecolor=BG_CARD, labelcolor=GREY1,
               loc="lower center", ncol=2, framealpha=0.8,
               bbox_to_anchor=(0.5, -0.15))

    # Chart 3: Traffic volume bar chart
    ax3 = fig.add_axes([0.76, 0.41, 0.22, 0.35])
    card_bg(ax3)
    tr_sorted = kpi_traffic.sort_values("total_flights")
    tr_colors = [PAL_ROUTE[i % len(PAL_ROUTE)] for i in range(len(tr_sorted))]
    ax3.barh(tr_sorted["route_name"], tr_sorted["total_flights"],
             color=tr_colors, alpha=0.9, height=0.65, zorder=3)
    ax3.set_xlabel("No. of Flights", color=GREY2, fontsize=7.5)
    ax3.tick_params(colors=GREY2, labelsize=7)
    ax3.set_title("Route Traffic\nVolume", color=GREY1,
                  fontsize=9, fontweight="bold")
    ax3.xaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax3.set_facecolor(BG_CARD)

    # Chart 4: Cancellation risk stacked bar
    ax4 = fig.add_axes([0.02, 0.06, 0.54, 0.30])
    card_bg(ax4)
    x_labels = kpi_cancel["route_name"].values
    x = np.arange(len(x_labels))
    total = kpi_cancel["total_bookings"].values
    confirmed = kpi_cancel["confirmed_bookings"].values
    cancelled = kpi_cancel["cancelled_bookings"].values
    pending = kpi_cancel["pending_bookings"].values
    ax4.bar(x, confirmed/total*100, label="Confirmed", color=C_GREEN, alpha=0.9, zorder=3)
    ax4.bar(x, cancelled/total*100, bottom=confirmed/total*100, label="Cancelled", color=C_RED, alpha=0.9, zorder=3)
    ax4.bar(x, pending/total*100, bottom=(confirmed+cancelled)/total*100, label="Pending", color=C_AMBER, alpha=0.85, zorder=3)
    ax4.set_xticks(x)
    ax4.set_xticklabels(x_labels, fontsize=8, color=GREY2, rotation=35, ha="right")
    ax4.set_ylabel("Booking Share (%)", color=GREY2, fontsize=8)
    ax4.tick_params(colors=GREY2)
    ax4.set_title("Route Booking Status Breakdown (Confirmed / Cancelled / Pending)", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax4.set_ylim(0, 100)
    ax4.legend(fontsize=8, facecolor=BG_CARD, labelcolor=GREY1, loc="upper right")
    ax4.yaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax4.set_facecolor(BG_CARD)

    # Chart 5: Age band by top 5 routes stacked bar
    ax5 = fig.add_axes([0.60, 0.06, 0.38, 0.30])
    card_bg(ax5)
    top5_routes = kpi_traffic.nlargest(5, "total_flights")["route_name"].tolist()
    age_filt = kpi_age[kpi_age["route_name"].isin(top5_routes)]
    age_pivot = age_filt.pivot(index="route_name", columns="age_band", values="passenger_count").fillna(0)
    age_colors = ["#1F6FEB", "#3FB950", "#D29922", "#F85149", "#BC8CFF"]
    bottom_arr = np.zeros(len(age_pivot))
    for j, band in enumerate(age_pivot.columns):
        vals = age_pivot[band].values
        ax5.bar(age_pivot.index, vals, bottom=bottom_arr, label=band,
                color=age_colors[j % len(age_colors)], alpha=0.88, zorder=3)
        bottom_arr += vals
    ax5.set_xticklabels(age_pivot.index, rotation=20, ha="right", fontsize=7.5, color=GREY2)
    ax5.tick_params(colors=GREY2)
    ax5.set_ylabel("Passengers", color=GREY2, fontsize=8)
    ax5.set_title("Age Band Distribution — Top 5 Routes", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax5.legend(fontsize=7, facecolor=BG_CARD, labelcolor=GREY1,
               loc="upper right", ncol=2)
    ax5.yaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax5.set_facecolor(BG_CARD)

    page_footer(fig, "Data Source: kpi_route_revenue  |  kpi_route_traffic  |  kpi_route_cancellations  |  kpi_age_band_by_route")
    plt.savefig(OUT / "page2_route_performance.png", dpi=300, bbox_inches="tight",
                facecolor=BG_DARK)
    plt.close()
    print("Page 2 saved.")


# ─────────────────────────────────────────────────────────────────────────────
# PAGE 3: Airline Trends
# ─────────────────────────────────────────────────────────────────────────────
def generate_page3():
    kpi_al_dist = pd.read_parquet(GOLD / "kpi_airline_distribution.parquet")
    kpi_al_dur  = pd.read_parquet(GOLD / "kpi_airline_duration.parquet")
    fact_pay    = pd.read_parquet(GOLD / "fact_payments.parquet")
    fact_b      = pd.read_parquet(GOLD / "fact_bookings.parquet")
    dim_al      = pd.read_parquet(GOLD / "dim_airline.parquet")
    kpi_pay     = pd.read_parquet(GOLD / "kpi_fare_by_payment_method.parquet")
    kpi_rev     = pd.read_parquet(GOLD / "kpi_route_revenue.parquet")

    # Merge airline name into payments for groupby
    pay_merged = fact_pay.merge(dim_al[["airline_key", "airline_name"]], on="airline_key", how="left")
    airline_rev = pay_merged.groupby("airline_name")["amount"].agg(["sum", "mean", "count"]).reset_index()
    airline_rev.columns = ["airline", "total_rev", "avg_fare", "transactions"]
    airline_rev = airline_rev.sort_values("total_rev", ascending=False)

    fig = plt.figure(figsize=(FIGW, FIGH), dpi=300)
    fig.patch.set_facecolor(BG_DARK)

    page_header(fig, 3, "Airline Competitive Trends & Revenue Split",
                "Airline market share, revenue comparison, payment method analytics, and operational efficiency")

    kpi_data = [
        ("4", "Airlines", "AI, SJ, UK, IndiGo", True, "#1F6FEB"),
        ("27.2%", "IndiGo Share", "Market leader", True, "#3FB950"),
        (f"INR {airline_rev.iloc[0]['avg_fare']:,.0f}", "Top Avg Fare", airline_rev.iloc[0]["airline"], True, "#D29922"),
        ("UPI 35.8%", "Top Payment", "Most used method", True, "#BC8CFF"),
        ("164.6 min", "Fleet Avg", "All airlines combined", True, "#0B93A0"),
    ]
    tile_w = 0.165
    for i, (val, lbl, delta, good, acc) in enumerate(kpi_data):
        kpi_tile(fig, [0.02 + i*(tile_w+0.008), 0.79, tile_w, 0.13],
                 val, lbl, delta, good, acc)

    # Chart 1: Market share donut
    ax1 = fig.add_axes([0.02, 0.41, 0.26, 0.35])
    card_bg(ax1)
    wedges, texts, autotexts = ax1.pie(
        kpi_al_dist["share_pct"],
        labels=kpi_al_dist["airline_name"],
        colors=PAL_AIRLINE,
        autopct="%1.1f%%",
        startangle=130,
        wedgeprops=dict(width=0.58, edgecolor=BG_DARK, linewidth=2.0),
        pctdistance=0.80,
        textprops={"fontsize": 8.5, "color": WHITE}
    )
    for wt in autotexts:
        wt.set_fontsize(8)
    ax1.set_title("Airline Market\nShare by Flights", color=GREY1,
                  fontsize=10, fontweight="bold")

    # Chart 2: Revenue by airline grouped (total + avg fare)
    ax2 = fig.add_axes([0.31, 0.41, 0.35, 0.35])
    card_bg(ax2)
    airlines = airline_rev["airline"].values
    x = np.arange(len(airlines))
    ax2_twin = ax2.twinx()
    bars = ax2.bar(x, airline_rev["total_rev"] / 1000, color=PAL_AIRLINE, alpha=0.9,
                   width=0.5, zorder=3, label="Total Revenue (INR K)")
    ax2_twin.plot(x, airline_rev["avg_fare"], "o--", color=C_AMBER, linewidth=2.0,
                  markersize=7, zorder=5, label="Avg Fare (INR)")
    ax2.set_xticks(x)
    ax2.set_xticklabels([a.split()[0] for a in airlines], color=GREY2, fontsize=9)
    ax2.set_ylabel("Revenue (INR K)", color=GREY2, fontsize=8)
    ax2_twin.set_ylabel("Avg Fare (INR)", color=C_AMBER, fontsize=8)
    ax2.tick_params(colors=GREY2)
    ax2_twin.tick_params(colors=C_AMBER)
    ax2.set_title("Revenue & Avg Fare by Airline", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax2.yaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    handles1, labels1 = ax2.get_legend_handles_labels()
    handles2, labels2 = ax2_twin.get_legend_handles_labels()
    ax2.legend(handles1+handles2, labels1+labels2, fontsize=7.5,
               facecolor=BG_CARD, labelcolor=GREY1, loc="upper right")
    ax2.set_facecolor(BG_CARD)
    ax2_twin.set_facecolor(BG_CARD)
    for spine in ax2_twin.spines.values():
        spine.set_edgecolor(C_BORDER)

    # Chart 3: Flight count comparison bar
    ax3 = fig.add_axes([0.69, 0.41, 0.29, 0.35])
    card_bg(ax3)
    ax3.bar(kpi_al_dist["airline_name"].str.split().str[0],
            kpi_al_dist["total_flights"],
            color=PAL_AIRLINE, alpha=0.9, width=0.55, zorder=3)
    for i, (name, val) in enumerate(zip(kpi_al_dist["airline_name"], kpi_al_dist["total_flights"])):
        ax3.text(i, val + 2, str(val), ha="center", fontsize=9, color=GREY1, fontweight="bold")
    ax3.set_ylabel("Total Flights", color=GREY2, fontsize=8)
    ax3.tick_params(colors=GREY2, labelsize=9)
    ax3.set_title("Total Flights per Airline", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax3.yaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax3.set_facecolor(BG_CARD)

    # Chart 4: Payment method breakdown
    ax4 = fig.add_axes([0.02, 0.06, 0.30, 0.30])
    card_bg(ax4)
    methods = kpi_pay["payment_method"].values
    txn_counts = kpi_pay["transaction_count"].values
    avg_amounts = kpi_pay["avg_amount"].values
    x4 = np.arange(len(methods))
    w4 = 0.35
    b1 = ax4.bar(x4 - w4/2, txn_counts, w4, color=["#1F6FEB", "#3FB950", "#D29922"], alpha=0.9, label="Transactions", zorder=3)
    ax4_twin = ax4.twinx()
    ax4_twin.bar(x4 + w4/2, avg_amounts, w4, color=["#0A3A7C", "#155A2A", "#7A4500"], alpha=0.75, label="Avg Amount (INR)", zorder=3)
    ax4.set_xticks(x4)
    ax4.set_xticklabels(methods, color=GREY2, fontsize=10)
    ax4.set_ylabel("Transactions", color=GREY2, fontsize=8)
    ax4_twin.set_ylabel("Avg Amount (INR)", color=GREY2, fontsize=8)
    ax4.tick_params(colors=GREY2)
    ax4_twin.tick_params(colors=GREY2)
    ax4.set_title("Payment Method — Volume & Avg Fare", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax4.yaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.4)
    ax4.set_facecolor(BG_CARD)
    for spine in ax4_twin.spines.values():
        spine.set_edgecolor(C_BORDER)
    handles1, _ = ax4.get_legend_handles_labels()
    handles2, _ = ax4_twin.get_legend_handles_labels()
    ax4.legend(handles1+handles2, ["Transactions", "Avg Amount (INR)"], fontsize=8,
               facecolor=BG_CARD, labelcolor=GREY1)

    # Chart 5: Airline duration efficiency scatter
    ax5 = fig.add_axes([0.36, 0.06, 0.30, 0.30])
    card_bg(ax5)
    for i, row in kpi_al_dur.iterrows():
        ax5.scatter(row["flight_count"], row["avg_duration_min"],
                    s=row["max_duration_min"] * 0.8, color=PAL_AIRLINE[i], alpha=0.85,
                    edgecolors=WHITE, linewidths=0.5, zorder=4)
        ax5.annotate(row["airline_name"].split()[0],
                     (row["flight_count"], row["avg_duration_min"] + 2),
                     fontsize=9, color=WHITE, ha="center")
    ax5.set_xlabel("Flight Count", color=GREY2, fontsize=8)
    ax5.set_ylabel("Avg Duration (min)", color=GREY2, fontsize=8)
    ax5.tick_params(colors=GREY2, labelsize=8)
    ax5.set_title("Airline Efficiency Bubble\n(size = max duration)", color=GREY1,
                  fontsize=9, fontweight="bold", pad=8)
    ax5.yaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax5.xaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax5.set_facecolor(BG_CARD)

    # Chart 6: Cumulative revenue by airline pie
    ax6 = fig.add_axes([0.70, 0.06, 0.28, 0.30])
    card_bg(ax6)
    ax6.pie(airline_rev["total_rev"],
            labels=[a.split()[0] for a in airline_rev["airline"]],
            colors=PAL_AIRLINE,
            autopct="%1.1f%%",
            startangle=90,
            wedgeprops=dict(width=0.55, edgecolor=BG_DARK, linewidth=1.5),
            pctdistance=0.78,
            textprops={"fontsize": 8.5, "color": WHITE})
    ax6.set_title("Revenue Share\nby Airline", color=GREY1,
                  fontsize=10, fontweight="bold")

    page_footer(fig, "Data Source: kpi_airline_distribution  |  fact_payments  |  dim_airline  |  kpi_fare_by_payment_method")
    plt.savefig(OUT / "page3_airline_trends.png", dpi=300, bbox_inches="tight",
                facecolor=BG_DARK)
    plt.close()
    print("Page 3 saved.")


# ─────────────────────────────────────────────────────────────────────────────
# PAGE 4: Delay & Anomaly Insights
# ─────────────────────────────────────────────────────────────────────────────
def generate_page4():
    fact_f   = pd.read_parquet(GOLD / "fact_flights.parquet")
    kpi_out  = pd.read_parquet(GOLD / "kpi_duration_outliers.parquet")
    kpi_summ = pd.read_parquet(GOLD / "kpi_overall_summary.parquet")
    kpi_cancel = pd.read_parquet(GOLD / "kpi_route_cancellations.parquet")
    kpi_pay  = pd.read_parquet(GOLD / "kpi_fare_by_payment_method.parquet")
    kpi_rt   = pd.read_parquet(GOLD / "kpi_route_duration.parquet")
    kpi_al   = pd.read_parquet(GOLD / "kpi_airline_duration.parquet")
    fact_b   = pd.read_parquet(GOLD / "fact_bookings.parquet")

    fig = plt.figure(figsize=(FIGW, FIGH), dpi=300)
    fig.patch.set_facecolor(BG_DARK)

    page_header(fig, 4, "Delay, Anomaly & Data Quality Insights",
                "Statistical outliers, overnight repairs, data imputation tracking, and booking integrity analysis")

    kpi_data = [
        ("0", "Negative Durations", "After pipeline fix", True, "#3FB950"),
        ("1", "Outlier Flights", "> 2 std from route avg", False, "#F85149"),
        ("1", "Overnight Repaired", "SJ192 +24h fix", True, "#D29922"),
        ("78", "Amounts Imputed", "Median INR 8,027", True, "#1F6FEB"),
        ("75", "Status Imputed", "Null/INVALID -> PENDING", True, "#BC8CFF"),
    ]
    tile_w = 0.165
    for i, (val, lbl, delta, good, acc) in enumerate(kpi_data):
        kpi_tile(fig, [0.02 + i*(tile_w+0.008), 0.79, tile_w, 0.13],
                 val, lbl, delta, good, acc)

    # Chart 1: Route deviation (std dev) from mean — sorted
    ax1 = fig.add_axes([0.02, 0.41, 0.35, 0.35])
    card_bg(ax1)
    # Compute route-level std from fact flights merged with dim_route
    dim_r = pd.read_parquet(GOLD / "dim_route.parquet")
    ff_r = fact_f.merge(dim_r[["route_key", "route_name"]], on="route_key")
    route_stats = ff_r.groupby("route_name")["duration_minutes"].agg(["mean", "std"]).reset_index()
    route_stats["std"] = route_stats["std"].fillna(0)
    route_stats = route_stats.sort_values("std", ascending=False).head(12)
    ax1.barh(route_stats["route_name"], route_stats["std"],
             color=[C_RED if v > 40 else C_AMBER if v > 25 else C_GREEN for v in route_stats["std"]],
             alpha=0.88, height=0.65, zorder=3)
    ax1.axvline(route_stats["std"].mean(), color=WHITE, linewidth=1.2, linestyle="--", alpha=0.6,
                label=f"Mean std: {route_stats['std'].mean():.1f} min")
    ax1.set_xlabel("Std Dev (minutes)", color=GREY2, fontsize=8)
    ax1.tick_params(colors=GREY2, labelsize=7.5)
    ax1.set_title("Duration Variability by Route (Std Dev)", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax1.xaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax1.legend(fontsize=8, facecolor=BG_CARD, labelcolor=GREY1)
    ax1.set_facecolor(BG_CARD)

    # Chart 2: Scatter — duration vs. route mean (outlier highlighted)
    ax2 = fig.add_axes([0.40, 0.41, 0.28, 0.35])
    card_bg(ax2)
    normal = fact_f[~fact_f["is_duration_outlier"]]
    outlier = fact_f[fact_f["is_duration_outlier"]]
    ax2.scatter(normal["route_mean_duration"], normal["duration_minutes"],
                s=12, alpha=0.35, color=C_ACCENT, label="Normal flights", zorder=3)
    ax2.scatter(outlier["route_mean_duration"], outlier["duration_minutes"],
                s=80, alpha=0.95, color=C_RED, marker="*", label="Outlier (>2σ)", zorder=5, edgecolors=WHITE, linewidths=0.5)
    max_d = max(fact_f["duration_minutes"].max(), fact_f["route_mean_duration"].max())
    ax2.plot([0, max_d], [0, max_d], "--", color=GREY2, linewidth=0.8, alpha=0.6, label="y = x (no deviation)")
    ax2.set_xlabel("Route Mean Duration (min)", color=GREY2, fontsize=8)
    ax2.set_ylabel("Actual Duration (min)", color=GREY2, fontsize=8)
    ax2.tick_params(colors=GREY2, labelsize=8)
    ax2.set_title("Actual vs Route Mean Duration\n(Outlier Detection)", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax2.legend(fontsize=7.5, facecolor=BG_CARD, labelcolor=GREY1)
    ax2.xaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.4)
    ax2.yaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.4)
    ax2.set_facecolor(BG_CARD)

    # Chart 3: Cancellation heatmap by route (top 10)
    ax3 = fig.add_axes([0.72, 0.41, 0.26, 0.35])
    card_bg(ax3)
    top_cancel = kpi_cancel.nlargest(10, "cancellation_rate_pct").sort_values("cancellation_rate_pct")
    bar_colors_c = [C_RED if v > 35 else C_AMBER if v > 28 else C_GREEN for v in top_cancel["cancellation_rate_pct"]]
    ax3.barh(top_cancel["route_name"], top_cancel["cancellation_rate_pct"],
             color=bar_colors_c, alpha=0.9, height=0.65, zorder=3)
    ax3.axvline(31.4, color=WHITE, linewidth=1.2, linestyle="--", alpha=0.7, label="Overall avg: 31.4%")
    for i, (route, val) in enumerate(zip(top_cancel["route_name"], top_cancel["cancellation_rate_pct"])):
        ax3.text(val + 0.3, i, f"{val:.1f}%", va="center", fontsize=7.5, color=GREY1)
    ax3.set_xlabel("Cancellation Rate (%)", color=GREY2, fontsize=8)
    ax3.tick_params(colors=GREY2, labelsize=7.5)
    ax3.set_title("Route Cancellation Rate\nRisk Ranking", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax3.xaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax3.legend(fontsize=8, facecolor=BG_CARD, labelcolor=GREY1)
    ax3.set_facecolor(BG_CARD)

    # Chart 4: Imputation audit waterfall
    ax4 = fig.add_axes([0.02, 0.06, 0.35, 0.30])
    card_bg(ax4)
    categories = ["Raw Flights", "After Dedup", "Raw Passengers", "After Dedup",
                  "Bookings Status\nImputed", "Payments\nImputed"]
    values = [1020, 1005, 1039, 1000, 75, 78]
    bar_cs = [C_ACCENT, C_GREEN, C_ACCENT, C_GREEN, C_AMBER, C_AMBER]
    ax4.barh(categories, values, color=bar_cs, alpha=0.9, height=0.65, zorder=3)
    for i, v in enumerate(values):
        ax4.text(v + 3, i, str(v), va="center", fontsize=9, color=GREY1, fontweight="bold")
    ax4.tick_params(colors=GREY2, labelsize=7.5)
    ax4.set_xlabel("Row Count", color=GREY2, fontsize=8)
    ax4.set_title("Data Quality — Row Tracking Summary", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax4.xaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax4.set_facecolor(BG_CARD)
    legend_patches = [
        mpatches.Patch(color=C_ACCENT, label="Raw ingested"),
        mpatches.Patch(color=C_GREEN, label="After dedup"),
        mpatches.Patch(color=C_AMBER, label="Imputed records"),
    ]
    ax4.legend(handles=legend_patches, fontsize=7.5, facecolor=BG_CARD, labelcolor=GREY1)

    # Chart 5: Booking status donut overall
    ax5 = fig.add_axes([0.41, 0.06, 0.26, 0.30])
    card_bg(ax5)
    status_counts = fact_b["status"].value_counts()
    ax5.pie(status_counts.values,
            labels=status_counts.index,
            colors=[C_GREEN, C_RED, C_AMBER],
            autopct="%1.1f%%",
            startangle=90,
            wedgeprops=dict(width=0.58, edgecolor=BG_DARK, linewidth=1.5),
            pctdistance=0.80,
            textprops={"fontsize": 9, "color": WHITE})
    ax5.set_title("Overall Booking\nStatus Split", color=GREY1,
                  fontsize=10, fontweight="bold")

    # Chart 6: Imputed vs real amounts payment
    ax6 = fig.add_axes([0.71, 0.06, 0.27, 0.30])
    card_bg(ax6)
    pay_merged = pd.read_parquet(GOLD / "fact_payments.parquet")
    imputed = pay_merged[pay_merged["is_amount_imputed"]]["amount"]
    real = pay_merged[~pay_merged["is_amount_imputed"]]["amount"]
    ax6.hist(real, bins=20, alpha=0.8, color=C_ACCENT, label=f"Real ({len(real)})", density=True, zorder=3)
    ax6.hist(imputed, bins=6, alpha=0.7, color=C_AMBER, label=f"Imputed ({len(imputed)})", density=True, zorder=4)
    ax6.axvline(real.mean(), color=WHITE, linestyle="--", linewidth=1.0, alpha=0.6)
    ax6.axvline(8027.12, color=C_AMBER, linestyle="-", linewidth=1.5, alpha=0.8)
    ax6.set_xlabel("Amount (INR)", color=GREY2, fontsize=8)
    ax6.set_ylabel("Density", color=GREY2, fontsize=8)
    ax6.tick_params(colors=GREY2, labelsize=7.5)
    ax6.set_title("Real vs Imputed Payment\nAmount Distribution", color=GREY1,
                  fontsize=10, fontweight="bold", pad=8)
    ax6.legend(fontsize=8, facecolor=BG_CARD, labelcolor=GREY1)
    ax6.yaxis.grid(True, color=GREY3, linewidth=0.5, alpha=0.5)
    ax6.set_facecolor(BG_CARD)

    page_footer(fig, "Data Source: fact_flights  |  kpi_duration_outliers  |  kpi_route_cancellations  |  fact_payments  |  fact_bookings")
    plt.savefig(OUT / "page4_delay_anomaly_insights.png", dpi=300, bbox_inches="tight",
                facecolor=BG_DARK)
    plt.close()
    print("Page 4 saved.")


if __name__ == "__main__":
    generate_page1()
    generate_page2()
    generate_page3()
    generate_page4()
    print("All 4 Power BI-style dashboard pages generated.")
