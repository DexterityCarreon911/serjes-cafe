import { useState, useEffect, useRef } from "react";
import { useStore, today, money } from "../store/useStore";
import { formatPeriodLabel, getCalendarPeriodDates, summarizeSales, calendarMonthGrid, calendarDateList } from "../store/useStore";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function Calendar({ data, session, chartKey }) {
  const { commit } = useStore();
  const [period, setPeriod] = useState("month");
  const [dateValue, setDateValue] = useState(today());
  const flowChartRef = useRef(null);

  useEffect(() => {
    window.__setCalendarDate = (d) => setDateValue(d);
    return () => { window.__setCalendarDate = undefined; };
  }, []);

  useEffect(() => {
    const sales = session.role === "admin" ? data.sales : data.sales.filter((s) => s.staff === session.username);
    const hours = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17"];
    const hv = hours.map((h) => sales.filter((s) => s.time.startsWith(h)).reduce((a, s) => a + 1, 0));
    if (flowChartRef.current) {
      const ctx = flowChartRef.current.getContext("2d");
      new Chart(ctx, {
        type: "bar",
        data: { labels: hours.map((h) => h + ":00"), datasets: [{ label: "Orders", data: hv, backgroundColor: "#fff" }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#bbb" } } }, scales: { x: { ticks: { color: "#888" }, grid: { color: "#222" } }, y: { ticks: { color: "#888" }, grid: { color: "#222" }, beginAtZero: true } } },
      });
    }

    return () => {
      Chart.getChart(flowChartRef.current)?.destroy();
    };
  }, [data.sales, session.username, chartKey]);

  function handleSwitchPeriod(p) {
    setPeriod(p);
    if (p === "day") {
      const d = new Date((dateValue || today()) + "T00:00:00");
      setDateValue(d.toISOString().slice(0, 10));
    }
  }

  function handleShiftMonth(offset) {
    const d = new Date((dateValue || today()) + "T00:00:00");
    d.setMonth(d.getMonth() + offset);
    setDateValue(d.toISOString().slice(0, 10));
  }

  const dates = getCalendarPeriodDates(period, dateValue);
  const rows = data.sales.filter((s) => dates.includes(s.date));
  const total = summarizeSales(rows);
  const note = (data.calendarNotes || {})[dateValue] || "";

  let calendarContent;
  if (period === "month") {
    calendarContent = calendarMonthGrid(dateValue, data, dateValue);
  } else {
    calendarContent = calendarDateList(period, dateValue, data, dateValue);
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <b>Digital Event Calendar</b>
        <div className="actions">
          {["day", "week", "month", "year"].map((p) => (
            <button key={p} className={`btn ${period === p ? "dark" : ""}`} onClick={() => handleSwitchPeriod(p)}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="grid2">
        <div className="panel">
          <div className="panel-head">
            <b>{formatPeriodLabel(period, dateValue)}</b>
            <div className="actions">
              <button className="btn dark" onClick={() => handleShiftMonth(-1)}>Prev</button>
              <button className="btn dark" onClick={() => handleShiftMonth(1)}>Next</button>
            </div>
          </div>
          <div className="cards" style={{ marginBottom: 15 }}>
            <div className="card"><div className="metric-label">REVENUE</div><div className="metric">{money(total.revenue)}</div></div>
            <div className="card"><div className="metric-label">PROFIT</div><div className="metric good">{money(total.profit)}</div></div>
            <div className="card"><div className="metric-label">ORDERS</div><div className="metric">{total.orders}</div></div>
            <div className="card"><div className="metric-label">ITEMS</div><div className="metric">{total.items}</div></div>
          </div>
          <div style={{ height: "auto", maxHeight: 520, overflow: "auto", paddingRight: 4 }} dangerouslySetInnerHTML={{ __html: calendarContent }} />
        </div>
        <div className="panel">
          <div className="panel-head"><b>Notes for {dateValue}</b></div>
          <textarea id="calendarNote" rows={8} style={{ width: "100%", resize: "vertical", background: "#090909", color: "#fff", border: "1px solid var(--line)", borderRadius: 10, padding: 12 }} defaultValue={note} />
          <div className="modal-actions" style={{ justifyContent: "flex-start", marginTop: 12 }}>
            <button className="btn" onClick={() => {
              const note = document.getElementById("calendarNote")?.value || "";
              commit((d) => {
                const next = structuredClone(d);
                next.calendarNotes = next.calendarNotes || {};
                next.calendarNotes[dateValue] = note;
                return next;
              });
            }}>Save Note</button>
          </div>
          <div className="muted" style={{ marginTop: 12 }}>Selected period: {period.toUpperCase()} • Total entries: {rows.length}</div>
        </div>
      </div>
      <div className="panel chart-card">
        <div className="panel-head"><b>Customer Flow by Hour</b></div>
        <div className="chart-wrap"><canvas ref={flowChartRef} id="flowChart"></canvas></div>
      </div>
    </div>
  );
}