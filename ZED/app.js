(function () {
  'use strict';

  // ---------- DOM 引用 ----------
  const $ = (sel) => document.querySelector(sel);
  const inputLinks = $('#inputLinks');
  const renamePrefix = $('#renamePrefix');
  const enableRename = $('#enableRename');
  const renameBody = $('#renameBody');
  const enableEch = $('#enableEch');
  const echBody = $('#echBody');
  const echValue = $('#echValue');
  const removeFragment = $('#removeFragment');
  const processBtn = $('#processBtn');
  const outputLinks = $('#outputLinks');
  const copyBtn = $('#copyBtn');
  const downloadBtn = $('#downloadBtn');
  const inputStats = $('#inputStats');
  const outputStats = $('#outputStats');
  const errorCard = $('#errorCard');
  const errorList = $('#errorList');

  // ---------- 协议识别 ----------
  const SUPPORTED_SCHEMES = ['vless://', 'trojan://', 'vmess://', 'ss://'];

  /**
   * 判断一行文本是否为可识别的配置链接
   */
  function isConfigLink(line) {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return SUPPORTED_SCHEMES.some((s) => trimmed.toLowerCase().startsWith(s));
  }

  /**
   * 解析链接，拆分为：scheme+authority+path?query#fragment
   * 返回 { base, query, fragment } 或 null（无效）
   */
  function parseLink(line) {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // 找到 fragment 分隔符
    const hashIdx = trimmed.indexOf('#');
    let basePart = hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed;
    const fragment = hashIdx >= 0 ? trimmed.slice(hashIdx + 1) : '';

    // 找到 query 分隔符
    const qIdx = basePart.indexOf('?');
    let schemeAndAuthority = qIdx >= 0 ? basePart.slice(0, qIdx) : basePart;
    const query = qIdx >= 0 ? basePart.slice(qIdx + 1) : '';

    // 基本结构校验：scheme://authority
    const schemeMatch = schemeAndAuthority.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
    if (!schemeMatch) return null;

    const scheme = schemeMatch[1].toLowerCase();
    if (!SUPPORTED_SCHEMES.includes(scheme + '://')) return null;

    // authority 部分必须有内容
    const authority = schemeAndAuthority.slice(schemeMatch[0].length);
    if (!authority || authority.length < 1) return null;

    return {
      scheme: scheme + '://',
      schemeAndAuthority,
      query,
      fragment,
      basePart,
      raw: trimmed,
    };
  }

  /**
   * 从 query 字符串中解析参数（保持原始顺序和编码）
   * 返回 [{ key, value, raw }] 数组
   */
  function parseQuery(query) {
    if (!query) return [];
    return query.split('&').filter(Boolean).map((pair) => {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) {
        return { key: pair, value: '', raw: pair };
      }
      return {
        key: pair.slice(0, eqIdx),
        value: pair.slice(eqIdx + 1),
        raw: pair,
      };
    });
  }

  /**
   * 将参数数组重新序列化为 query 字符串
   */
  function serializeQuery(params) {
    return params.map((p) => p.raw).join('&');
  }

  /**
   * 对 fragment 进行 URL 编码（保留用户可读性，仅编码必要字符）
   */
  function encodeFragment(text) {
    // 使用 encodeURIComponent 但保留一些常见字符
    return encodeURIComponent(text).replace(/%20/g, '-');
  }

  /**
   * 构建最终链接
   */
  function buildLink(parsed, newFragment, extraQueryParams) {
    let queryStr = parsed.query;
    if (extraQueryParams && extraQueryParams.length > 0) {
      const baseParams = parseQuery(queryStr);
      const merged = baseParams.concat(extraQueryParams);
      queryStr = serializeQuery(merged);
    }

    let result = parsed.schemeAndAuthority;
    if (queryStr) result += '?' + queryStr;
    if (newFragment) result += '#' + newFragment;
    return result;
  }

  // ---------- 核心处理 ----------
  function process() {
    const rawInput = inputLinks.value;
    const lines = rawInput.split('\n');

    // 输入统计
    const nonEmptyLines = lines.filter((l) => l.trim() !== '');
    const validLines = [];
    const invalidLines = [];

    // 先做一遍校验，收集有效行和无效行
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (isConfigLink(trimmed)) {
        const parsed = parseLink(trimmed);
        if (parsed) {
          validLines.push({ line: trimmed, parsed, originalIndex: idx });
        } else {
          invalidLines.push({ line: trimmed, reason: 'ساختار لینک نامعتبر', originalIndex: idx });
        }
      } else {
        invalidLines.push({ line: trimmed, reason: 'پروتکل پشتیبانی نمی‌شود', originalIndex: idx });
      }
    });

    // 输入统计显示
    inputStats.innerHTML =
      `کل خطوط: <strong>${nonEmptyLines.length}</strong> | ` +
      `معتبر: <span class="success">${validLines.length}</span> | ` +
      `نامعتبر: <span class="error">${invalidLines.length}</span>`;

    // 错误列表
    if (invalidLines.length > 0) {
      errorCard.style.display = 'block';
      errorList.innerHTML = invalidLines
        .map(
          (e) =>
            `<li><span class="line-num">خط ${e.originalIndex + 1}:</span> ${escapeHtml(e.line)}<br><small style="color:#ff6b6b">${e.reason}</small></li>`
        )
        .join('');
    } else {
      errorCard.style.display = 'none';
      errorList.innerHTML = '';
    }

    // 处理有效行
    const renameEnabled = enableRename.checked;
    const prefix = renamePrefix.value.trim();
    const removeFrag = removeFragment.checked;
    const echEnabled = enableEch.checked;
    const echRaw = echValue.value.trim();

    const results = [];

    validLines.forEach((item, idx) => {
      const parsed = item.parsed;
      let newFragment = parsed.fragment;

      // 1. 处理 Fragment / 重命名
      if (renameEnabled && prefix) {
        newFragment = prefix + '-' + (idx + 1);
      } else if (removeFrag) {
        newFragment = '';
      }
      // 否则保留原始 fragment

      // 2. 处理 ECH 参数
      const extraQuery = [];
      if (echEnabled && echRaw) {
        // 检查是否已经存在 ech 参数
        const existingParams = parseQuery(parsed.query);
        const hasEch = existingParams.some((p) => p.key.toLowerCase() === 'ech');
        if (!hasEch) {
          extraQuery.push({ key: 'ech', value: echRaw, raw: 'ech=' + echRaw });
        }
        // 如果已存在则跳过，不覆盖（避免改变未知参数）
      }

      // 3. 构建结果
      const resultLink = buildLink(parsed, newFragment, extraQuery);
      results.push(resultLink);
    });

    // 输出
    outputLinks.value = results.join('\n');

    // 输出统计
    outputStats.innerHTML =
      `خروجی: <strong>${results.length}</strong> کانفیگ | ` +
      `حذف‌شده: <span class="error">${invalidLines.length}</span>`;

    // 按钮状态
    const hasOutput = results.length > 0;
    copyBtn.disabled = !hasOutput;
    downloadBtn.disabled = !hasOutput;
  }

  // ---------- 工具函数 ----------
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function copyOutput() {
    const text = outputLinks.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'کپی شد ✓';
      setTimeout(() => (copyBtn.textContent = 'کپی'), 1500);
    }).catch(() => {
      // Fallback
      outputLinks.select();
      document.execCommand('copy');
      copyBtn.textContent = 'کپی شد ✓';
      setTimeout(() => (copyBtn.textContent = 'کپی'), 1500);
    });
  }

  function downloadOutput() {
    const text = outputLinks.value;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'configs-' + Date.now() + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------- 事件绑定 ----------
  processBtn.addEventListener('click', process);

  enableRename.addEventListener('change', () => {
    renameBody.style.display = enableRename.checked ? 'block' : 'none';
  });

  enableEch.addEventListener('change', () => {
    echBody.style.display = enableEch.checked ? 'block' : 'none';
  });

  copyBtn.addEventListener('click', copyOutput);
  downloadBtn.addEventListener('click', downloadOutput);

  // 初始状态
  renameBody.style.display = enableRename.checked ? 'block' : 'none';
  echBody.style.display = enableEch.checked ? 'block' : 'none';

  // 输入变化时清除旧输出
  inputLinks.addEventListener('input', () => {
    outputLinks.value = '';
    outputStats.innerHTML = '';
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    errorCard.style.display = 'none';
    errorList.innerHTML = '';
    inputStats.innerHTML = '';
  });
})();