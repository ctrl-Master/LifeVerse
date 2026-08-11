/**
 * Life Trajectory Analyzer - Charts Module
 * ECharts initialization for all data visualizations
 * All colors are derived from CSS variables defined in :root
 */

(function () {
  'use strict';

  // -- Utility: read CSS variable value from document root --
  function getCSSVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  // -- Build a unified color palette from CSS variables --
  function getPalette() {
    return {
      accent: getCSSVar('--accent') || '#4f46e5',
      accent2: getCSSVar('--accent2') || '#d97706',
      ink: getCSSVar('--ink') || '#1a1d2e',
      muted: getCSSVar('--muted') || '#6b7280',
      rule: getCSSVar('--rule') || '#e5e7eb',
      bg2: getCSSVar('--bg2') || '#ffffff',
      // Extended palette for multi-series charts
      series: [
        getCSSVar('--accent') || '#4f46e5',
        getCSSVar('--accent2') || '#d97706',
        '#0ea5e9',
        '#10b981',
        '#8b5cf6',
        '#f43f5e'
      ]
    };
  }

  // -- Shared base option fragment --
  function baseTooltip() {
    return {
      trigger: 'item',
      appendToBody: true,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: getCSSVar('--accent') || '#4f46e5',
      borderWidth: 1,
      textStyle: {
        color: getCSSVar('--ink') || '#1a1d2e',
        fontSize: 13
      },
      extraCssText: 'backdrop-filter: blur(8px); box-shadow: 0 4px 20px rgba(79,70,229,0.15); border-radius: 8px;'
    };
  }

  function baseAxisLabel() {
    var muted = getCSSVar('--muted') || '#6b7280';
    return {
      color: muted,
      fontSize: 12
    };
  }

  // -- Registry to track all chart instances for resize --
  var chartInstances = [];

  function registerChart(chart) {
    chartInstances.push(chart);
    return chart;
  }

  // ================================================================
  // Chart 1: Pie - Mirror Cohort Path Distribution
  // ================================================================
  function initPathDistributionPie(domId) {
    var el = document.getElementById(domId);
    if (!el || typeof echarts === 'undefined') return null;
    var p = getPalette();

    var chart = echarts.init(el);
    var option = {
      animation: false,
      tooltip: Object.assign(baseTooltip(), {
        trigger: 'item',
        formatter: '{b}<br/>占比: {d}%<br/>人数: {c}人'
      }),
      legend: {
        bottom: '0%',
        left: 'center',
        textStyle: { color: p.muted, fontSize: 12 },
        itemWidth: 14,
        itemHeight: 14,
        itemGap: 16
      },
      color: [p.accent, p.accent2, '#0ea5e9', '#10b981'],
      series: [
        {
          name: '路径分布',
          type: 'pie',
          radius: ['38%', '65%'],
          center: ['50%', '42%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: p.bg2,
            borderWidth: 3
          },
          label: {
            show: true,
            formatter: '{d}%',
            color: p.ink,
            fontSize: 14,
            fontWeight: 'bold'
          },
          labelLine: {
            length: 12,
            length2: 10,
            lineStyle: { color: p.muted }
          },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' },
            itemStyle: {
              shadowBlur: 12,
              shadowColor: 'rgba(79,70,229,0.3)'
            }
          },
          data: [
            { value: 1504, name: '留在原行业深耕' },
            { value: 896, name: '跨行转型' },
            { value: 480, name: '创业/自由职业' },
            { value: 320, name: '考公/考研' }
          ]
        }
      ]
    };
    chart.setOption(option);
    return registerChart(chart);
  }

  // ================================================================
  // Chart 2: Radar - User Capability Profile
  // ================================================================
  function initCapabilityRadar(domId) {
    var el = document.getElementById(domId);
    if (!el || typeof echarts === 'undefined') return null;
    var p = getPalette();

    var chart = echarts.init(el);
    var option = {
      animation: false,
      tooltip: Object.assign(baseTooltip(), {
        trigger: 'item',
        formatter: function (params) {
          var indicators = ['专业技能', '沟通协调', '系统思维', '学习能力', '抗压性'];
          var html = '<b>能力画像</b><br/>';
          for (var i = 0; i < params.value.length; i++) {
            html += indicators[i] + ': ' + params.value[i] + '/100<br/>';
          }
          return html;
        }
      }),
      legend: {
        bottom: '0%',
        left: 'center',
        textStyle: { color: p.muted, fontSize: 12 },
        itemWidth: 14,
        itemHeight: 14
      },
      radar: {
        indicator: [
          { name: '专业技能', max: 100 },
          { name: '沟通协调', max: 100 },
          { name: '系统思维', max: 100 },
          { name: '学习能力', max: 100 },
          { name: '抗压性', max: 100 }
        ],
        center: ['50%', '48%'],
        radius: '62%',
        axisName: {
          color: p.ink,
          fontSize: 13,
          fontWeight: 'bold'
        },
        splitArea: {
          areaStyle: {
            color: [
              'rgba(79,70,229,0.03)',
              'rgba(79,70,229,0.06)',
              'rgba(79,70,229,0.09)',
              'rgba(217,119,6,0.06)',
              'rgba(217,119,6,0.09)'
            ]
          }
        },
        axisLine: { lineStyle: { color: p.rule } },
        splitLine: { lineStyle: { color: p.rule } }
      },
      series: [
        {
          name: '能力对比',
          type: 'radar',
          data: [
            {
              value: [78, 65, 72, 85, 60],
              name: '当前能力',
              areaStyle: { color: 'rgba(79,70,229,0.15)' },
              lineStyle: { color: p.accent, width: 2 },
              itemStyle: { color: p.accent },
              symbolSize: 6
            },
            {
              value: [90, 80, 85, 88, 75],
              name: '目标岗位要求',
              areaStyle: { color: 'rgba(217,119,6,0.10)' },
              lineStyle: { color: p.accent2, width: 2, type: 'dashed' },
              itemStyle: { color: p.accent2 },
              symbolSize: 6
            }
          ]
        }
      ]
    };
    chart.setOption(option);
    return registerChart(chart);
  }

  // ================================================================
  // Chart 3: Line - Skill Half-Life Warning
  // ================================================================
  function initSkillDecayLine(domId) {
    var el = document.getElementById(domId);
    if (!el || typeof echarts === 'undefined') return null;
    var p = getPalette();

    var years = ['现在', '1年', '2年', '3年', '4年', '5年', '6年', '7年', '8年', '9年', '10年'];

    var chart = echarts.init(el);
    var option = {
      animation: false,
      tooltip: Object.assign(baseTooltip(), {
        trigger: 'axis',
        formatter: function (params) {
          var html = '<b>' + params[0].axisValue + '</b><br/>';
          for (var i = 0; i < params.length; i++) {
            html += params[i].marker + params[i].seriesName + ': ' + params[i].value + '%<br/>';
          }
          return html;
        }
      }),
      legend: {
        top: '2%',
        left: 'center',
        textStyle: { color: p.muted, fontSize: 12 },
        itemWidth: 14,
        itemHeight: 14
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: years,
        axisLine: { lineStyle: { color: p.rule } },
        axisLabel: baseAxisLabel(),
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        max: 100,
        min: 0,
        axisLabel: Object.assign(baseAxisLabel(), { formatter: '{value}%' }),
        splitLine: { lineStyle: { color: p.rule, type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      color: [p.accent, p.accent2, '#10b981'],
      series: [
        {
          name: '框架开发技能 (半衰期2年)',
          type: 'line',
          smooth: true,
          data: [100, 82, 65, 48, 35, 25, 18, 12, 8, 5, 3],
          lineStyle: { width: 3 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(79,70,229,0.25)' },
                { offset: 1, color: 'rgba(79,70,229,0.01)' }
              ]
            }
          },
          symbol: 'circle',
          symbolSize: 6,
          markPoint: {
            symbol: 'pin',
            symbolSize: 40,
            data: [
              { name: '红利期结束', value: '48%', xAxis: 3, yAxis: 48,
                itemStyle: { color: '#f43f5e' } }
            ]
          }
        },
        {
          name: '系统架构能力 (半衰期5年)',
          type: 'line',
          smooth: true,
          data: [100, 92, 85, 78, 70, 62, 54, 46, 38, 30, 24],
          lineStyle: { width: 3 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(217,119,6,0.25)' },
                { offset: 1, color: 'rgba(217,119,6,0.01)' }
              ]
            }
          },
          symbol: 'circle',
          symbolSize: 6
        },
        {
          name: '商业判断力 (半衰期10年)',
          type: 'line',
          smooth: true,
          data: [100, 98, 95, 93, 90, 88, 85, 82, 78, 74, 70],
          lineStyle: { width: 3 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16,185,129,0.20)' },
                { offset: 1, color: 'rgba(16,185,129,0.01)' }
              ]
            }
          },
          symbol: 'circle',
          symbolSize: 6
        }
      ]
    };
    chart.setOption(option);
    return registerChart(chart);
  }

  // ================================================================
  // Chart 4: Bar - Sandbox Simulation Comparison
  // ================================================================
  function initSandboxBar(domId, scenarioData) {
    var el = document.getElementById(domId);
    if (!el || typeof echarts === 'undefined') return null;
    var p = getPalette();

    // Default data if none provided
    var data = scenarioData || {
      categories: ['维持现状', '同行业深耕', '跨行业转型', '考公/体制内'],
      year5: [28, 38, 22, 20],
      year10: [32, 52, 40, 30]
    };

    var chart = echarts.init(el);
    var option = {
      animation: false,
      tooltip: Object.assign(baseTooltip(), {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function (params) {
          var html = '<b>' + params[0].axisValue + '</b><br/>';
          for (var i = 0; i < params.length; i++) {
            html += params[i].marker + params[i].seriesName + ': ' + params[i].value + '万/年<br/>';
          }
          return html;
        }
      }),
      legend: {
        top: '2%',
        left: 'center',
        textStyle: { color: p.muted, fontSize: 12 },
        itemWidth: 14,
        itemHeight: 14
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '5%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.categories,
        axisLine: { lineStyle: { color: p.rule } },
        axisLabel: Object.assign(baseAxisLabel(), { fontSize: 13 }),
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '预期年收入(万)',
        nameTextStyle: { color: p.muted, fontSize: 11 },
        axisLabel: Object.assign(baseAxisLabel(), { formatter: '{value}万' }),
        splitLine: { lineStyle: { color: p.rule, type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      color: [p.accent, p.accent2],
      series: [
        {
          name: '5年后预期收入',
          type: 'bar',
          data: data.year5,
          barWidth: '28%',
          barGap: '15%',
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: p.accent },
                { offset: 1, color: 'rgba(79,70,229,0.4)' }
              ]
            }
          },
          label: {
            show: true,
            position: 'top',
            color: p.ink,
            fontSize: 12,
            fontWeight: 'bold',
            formatter: '{c}万'
          }
        },
        {
          name: '10年后预期收入',
          type: 'bar',
          data: data.year10,
          barWidth: '28%',
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: p.accent2 },
                { offset: 1, color: 'rgba(217,119,6,0.4)' }
              ]
            }
          },
          label: {
            show: true,
            position: 'top',
            color: p.ink,
            fontSize: 12,
            fontWeight: 'bold',
            formatter: '{c}万'
          }
        }
      ]
    };
    chart.setOption(option);
    return registerChart(chart);
  }

  // ================================================================
  // Resize handler - debounced, listens to window resize
  // ================================================================
  var resizeTimer = null;
  function handleResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      for (var i = 0; i < chartInstances.length; i++) {
        if (chartInstances[i] && !chartInstances[i].isDisposed()) {
          chartInstances[i].resize();
        }
      }
    }, 150);
  }

  if (window.addEventListener) {
    window.addEventListener('resize', handleResize);
  } else if (window.attachEvent) {
    window.attachEvent('onresize', handleResize);
  }

  // -- Expose API --
  window.LTACharts = {
    initPathDistributionPie: initPathDistributionPie,
    initCapabilityRadar: initCapabilityRadar,
    initSkillDecayLine: initSkillDecayLine,
    initSandboxBar: initSandboxBar,
    getPalette: getPalette,
    resizeAll: handleResize
  };
})();
