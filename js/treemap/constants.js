export const LAYOUT = {
    PATHBAR_HEIGHT: 24,
    FOOTER_HEIGHT: 25,
    TOOLTIP_OFFSET: 12,
    SECTOR_HEADER_HEIGHT: 20,
    PADDING: {
        TOP: 2,
        INNER: 1,
        OUTER: 2,
        RIGHT: 2,
        BOTTOM: 2,
        LEFT: 2,
        TEXT: 6,
    },
};
export const RECURSION = {
    MAX_DEPTH: 3,
};
export const COLORS = {
    PATHBAR_BG: '#414554',
    PATHBAR_BORDER: '#555',
    SECTOR_STROKE: '#2C3E50',
    TEXT_WHITE: '#ffffff',
    TEXT_SHADOW: 'rgba(0, 0, 0, 0.7)',
    TOOLTIP_SHADOW: '0 2px 8px rgba(0,0,0,0.15)',
    OVERLAY_BG: 'rgba(0, 0, 0, 0.8)',
    OVERLAY_CONTENT: '#2C3E50',
};
export const TRANSITIONS = {
    DRILL: 250,
    TOOLTIP: 150,
    OVERLAY_SHOW: 300,
    OVERLAY_HIDE: 250,
    HOVER: 200,
};
export const FONT = {
    FAMILY: '"Open Sans", verdana, arial, sans-serif',
    SIZE: {
        PATHBAR: '14px',
        TOOLTIP: '12px',
        SECTOR: '12px',
        OVERLAY: '24px',
    },
};
export const COLOR_SCALE = d3
    .scaleLinear()
    .domain([-3, 0, 3])
    .range(['rgb(236, 48, 51)', 'rgb(64, 68, 82)', 'rgb(42, 202, 85)'])
    .clamp(true)
    .interpolate(d3.interpolateRgb);
//# sourceMappingURL=constants.js.map