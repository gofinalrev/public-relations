"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { formatNumber } from "@/lib/utils";
import type { ApexOptions } from "apexcharts";

const ApexChart = dynamic(
  () => import("react-apexcharts").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <div className="w-full animate-pulse rounded-xl bg-muted/30" style={{ minHeight: 200 }} />,
  },
);

export type DashboardChartSeries = {
  name: string;
  data: number[];
  color?: string;
};

type DashboardBarChartProps = {
  categories: string[];
  series: DashboardChartSeries[];
  height?: number;
  stacked?: boolean;
  yFormatter?: (value: number) => string;
};

const DEFAULT_COLORS = [
  "hsl(72 100% 50%)",
  "hsl(72 70% 42%)",
  "hsl(0 0% 55%)",
  "hsl(72 100% 35%)",
];

export function DashboardBarChart({
  categories,
  series,
  height = 280,
  stacked = false,
  yFormatter = formatNumber,
}: DashboardBarChartProps) {
  const { theme, mounted } = useTheme();
  const isDark = theme === "dark";

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        stacked,
        toolbar: { show: false },
        zoom: { enabled: false },
        background: "transparent",
        fontFamily: "var(--font-figtree), system-ui, sans-serif",
        animations: { enabled: true, speed: 400 },
      },
      theme: { mode: isDark ? "dark" : "light" },
      plotOptions: {
        bar: {
          borderRadius: 6,
          borderRadiusApplication: "end",
          columnWidth: stacked ? "55%" : "62%",
        },
      },
      colors: series.map((s, i) => s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]),
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ["transparent"] },
      grid: {
        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        padding: { left: 8, right: 8 },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
            fontSize: "11px",
            fontWeight: 500,
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (v) => yFormatter(Number(v)),
          style: {
            colors: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
            fontSize: "11px",
          },
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
        fontSize: "12px",
        fontWeight: 500,
        labels: { colors: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)" },
        markers: { size: 6, shape: "circle", offsetX: -2 },
        itemMargin: { horizontal: 12, vertical: 4 },
      },
      tooltip: {
        theme: isDark ? "dark" : "light",
        y: { formatter: (v) => yFormatter(Number(v)) },
      },
    }),
    [categories, isDark, series, stacked, yFormatter],
  );

  if (!mounted) {
    return <div className="w-full animate-pulse rounded-xl bg-muted/30" style={{ height }} />;
  }

  return (
    <ApexChart
      type="bar"
      height={height}
      width="100%"
      options={options}
      series={series.map((s) => ({ name: s.name, data: s.data }))}
    />
  );
}

type DashboardAreaChartProps = {
  categories: string[];
  series: DashboardChartSeries[];
  height?: number;
};

export function DashboardAreaChart({ categories, series, height = 260 }: DashboardAreaChartProps) {
  const { theme, mounted } = useTheme();
  const isDark = theme === "dark";

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "area",
        toolbar: { show: false },
        zoom: { enabled: false },
        background: "transparent",
        fontFamily: "var(--font-figtree), system-ui, sans-serif",
      },
      theme: { mode: isDark ? "dark" : "light" },
      stroke: { curve: "smooth", width: 2.5 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.02,
          stops: [0, 90, 100],
        },
      },
      colors: series.map((s, i) => s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]),
      dataLabels: { enabled: false },
      grid: {
        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        strokeDashArray: 4,
        padding: { left: 8, right: 8 },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
            fontSize: "11px",
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (v) => formatNumber(Number(v)),
          style: {
            colors: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
            fontSize: "11px",
          },
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
        fontSize: "12px",
        labels: { colors: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)" },
        markers: { size: 6, shape: "circle" },
      },
      tooltip: { theme: isDark ? "dark" : "light" },
    }),
    [categories, isDark, series],
  );

  if (!mounted) {
    return <div className="w-full animate-pulse rounded-xl bg-muted/30" style={{ height }} />;
  }

  return (
    <ApexChart
      type="area"
      height={height}
      width="100%"
      options={options}
      series={series.map((s) => ({ name: s.name, data: s.data }))}
    />
  );
}
