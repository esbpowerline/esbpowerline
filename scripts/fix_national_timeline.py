import re
from pathlib import Path

ROOT = Path(r"C:\Users\hamim\esbpowerline\components\news\power-grid\petrobangla-archive")
FILE = ROOT / "PetrobanglaArchiveNationalTimeline.tsx"

def main():
    text = FILE.read_text(encoding="utf-8")
    
    parts = text.split("  const wrapperClass = embedded ? 'grid-explorer-gas-subview' : 'grid-explorer-chart-card card';")
    before = parts[0] + "  const wrapperClass = embedded ? 'grid-explorer-gas-subview' : 'grid-explorer-chart-card card';\n\n"
    
    new_return = """  const chartBlock = (
    <div className="gas-reserve-archive-chart-block">
      <ArchiveRangeLockedOverlay preset={preset} onClose={onClose}>
        <div
          className={cn(
            'grid-explorer-chart-area w-full gas-reserve-archive-chart-block__plot',
            compact ? 'gas-reserve-archive-timeline' : 'grid-explorer-chart-area--lg',
          )}
        >
          {chartsReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={GRID_EXPLORER_CHART_MARGIN.default}>
                <CartesianGrid strokeDasharray="3 6" stroke={chartTheme.gridStroke} opacity={0.3} vertical={false} />
                <XAxis
                  {...gridChartXAxisProps(chartTheme, {
                    dataKey: 'date',
                    tickFormatter: (v: string) => v.slice(0, 7),
                    interval: Math.max(0, Math.floor(chartData.length / 12)),
                  })}
                />
                <YAxis
                  {...gridChartYAxisProps(chartTheme, {
                    tickFormatter: (v) => formatNumber(v, 0),
                    domain: [0, 'auto'],
                  })}
                />
                <GridRechartsTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as (typeof chartData)[0];
                    return (
                      <GridChartTooltipShell title={d.date} accent={PB_ARCHIVE_COLORS.domestic}>
                        <div className="grid-chart-tooltip__grid">
                          <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                            <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.domestic }} />
                            Domestic gas
                          </span>
                          <span className="grid-chart-tooltip__value" style={{ color: PB_ARCHIVE_COLORS.domestic }}>
                            {formatNumber(d.domestic, 1)} MMCFD
                          </span>
                          <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                            <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.lng }} />
                            Imported LNG
                          </span>
                          <span className="grid-chart-tooltip__value" style={{ color: PB_ARCHIVE_COLORS.lng }}>
                            {formatNumber(d.lng, 1)} MMCFD
                          </span>
                          <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                            <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.totalLine }} />
                            Grand total
                          </span>
                          <span className="grid-chart-tooltip__value" style={{ color: PB_ARCHIVE_COLORS.totalLine }}>
                            {formatNumber(d.total, 1)} MMCFD
                          </span>
                          {showMa && d.totalMa != null && (
                            <>
                              <span className="grid-chart-tooltip__label flex items-center gap-1.5">
                                <span className="grid-chart-tooltip__dot shrink-0" style={{ background: PB_ARCHIVE_COLORS.ma }} />
                                7-day MA
                              </span>
                              <span className="grid-chart-tooltip__value" style={{ color: PB_ARCHIVE_COLORS.ma }}>
                                {formatNumber(d.totalMa, 1)} MMCFD
                              </span>
                            </>
                          )}
                        </div>
                      </GridChartTooltipShell>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="domestic"
                  stackId="1"
                  stroke={PB_ARCHIVE_COLORS.domestic}
                  fill={PB_ARCHIVE_COLORS.domestic}
                  fillOpacity={0.22}
                  strokeWidth={2}
                  legendType="none"
                />
                <Area
                  type="monotone"
                  dataKey="lng"
                  stackId="1"
                  stroke={PB_ARCHIVE_COLORS.lng}
                  fill={PB_ARCHIVE_COLORS.lng}
                  fillOpacity={0.28}
                  strokeWidth={2}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={PB_ARCHIVE_COLORS.totalLine}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: PB_ARCHIVE_COLORS.totalLine }}
                  legendType="none"
                />
                {showMa && (
                  <Line
                    type="monotone"
                    dataKey="totalMa"
                    stroke={PB_ARCHIVE_COLORS.ma}
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                    legendType="none"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Loading national timeline...
            </div>
          )}
        </div>
      </ArchiveRangeLockedOverlay>
      {chartsReady && (
        <GridChartExternalLegend
          items={legendItems}
          className="mt-4"
          caption="Domestic production vs LNG imports. Dashed line = national total."
        />
      )}
    </div>
  );

  if (compact) {
    return (
      <div className={wrapperClass}>
        <MacroGasInnerSection
          icon={History}
          title="National Timeline"
          subtitle={`${timeline.ok_days.toLocaleString()} verified days — domestic vs LNG`}
          toolbar={rangeToolbar}
        >
          <div className="space-y-3">
            {chartBlock}
          </div>
        </MacroGasInnerSection>
      </div>
    );
  }

  return (
    <div className={cn(wrapperClass, 'space-y-4')}>
      <div className="grid-explorer-chart-card__head grid-explorer-chart-card__head--border">
        <div className="flex-1 min-w-0">
          <h3 className="grid-explorer-chart-card__title">
            National Gas Timeline (2020—today)<ArchiveBadge />
          </h3>
          <p className="grid-explorer-chart-card__sub">
            Domestic fields vs imported LNG · {timeline.ok_days.toLocaleString()} verified days
          </p>
        </div>
      </div>
      <ArchiveInsightCallout>
        Domestic fields vs imported LNG — LNG rising while domestic output falls is the long-term pattern.
      </ArchiveInsightCallout>
      {chartBlock}
    </div>
  );
}
"""
    FILE.write_text(before + new_return, encoding="utf-8")
    print("Replaced end of file")

if __name__ == '__main__':
    main()
