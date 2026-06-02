import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import html2canvas from 'html2canvas';

// 海报配置
const POSTER_CONFIG = {
  width: 900,
  scale: 2,
  bg: '#ffffff',
  primary: '#f97316',
  primaryLight: '#fff7ed',
  textMain: '#1f2937',
  textBody: '#374151',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  tagOrange: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  tagGray: { bg: '#f9fafb', text: '#4b5563', border: '#e5e7eb' },
};

const SharePoster = forwardRef(({ job }, ref) => {
  const posterRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const parseListItems = (text) => {
    if (!text) return [];
    const items = text.split(/\n\s*\d+[\.、]/).filter(Boolean);
    if (items.length > 1) {
      return items.map(s => s.trim()).filter(s => s.length > 5).slice(0, 4);
    }
    const sentences = text.split(/[。！？\n]+/).filter(s => s.trim().length > 8);
    return sentences.slice(0, 4);
  };

  const descItems = parseListItems(job.description || job.fullDescription);
  const reqItems = parseListItems(job.requirements?.join ? job.requirements.join('\n') : job.requirements);

  const generate = async () => {
    if (!posterRef.current) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: POSTER_CONFIG.scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: POSTER_CONFIG.bg,
        logging: false,
        windowWidth: posterRef.current.scrollWidth,
        height: posterRef.current.scrollHeight,
      });

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 0.95);
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${job.company}_${job.title}_分享海报.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      return url;
    } catch (err) {
      console.error('海报生成失败', err);
      alert('海报生成失败，请重试');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  useImperativeHandle(ref, () => ({ generate, generating }));

  const typeTags = job.type || [];
  const locationTag = job.location;
  const salaryText = job.salaryRange || job.salary || '';

  return (
    <>
      <div
        ref={posterRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: `${POSTER_CONFIG.width}px`,
          background: POSTER_CONFIG.bg,
          fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          padding: '48px 40px 40px',
          boxSizing: 'border-box',
          lineHeight: 1.6,
        }}
      >
        {/* 顶部装饰 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#22c55e' }} />
        </div>

        {/* 公司名 */}
        <div style={{ fontSize: '28px', color: POSTER_CONFIG.textMuted, marginBottom: '8px', fontWeight: 500 }}>
          {job.company}
        </div>

        {/* 职位 + 薪资 */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '36px', fontWeight: 700, color: POSTER_CONFIG.textMain, lineHeight: 1.3 }}>
            {job.title}
          </span>
          {salaryText && (
            <span style={{ fontSize: '36px', fontWeight: 700, color: POSTER_CONFIG.textMain, marginLeft: '12px' }}>
              {salaryText}
            </span>
          )}
        </div>

        {/* 标签行 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
          {typeTags.map((t, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', padding: '6px 18px', borderRadius: '999px',
              fontSize: '18px', fontWeight: 500,
              background: POSTER_CONFIG.tagOrange.bg, color: POSTER_CONFIG.tagOrange.text,
              border: `1px solid ${POSTER_CONFIG.tagOrange.border}`,
            }}>
              {t}
            </span>
          ))}
          {locationTag && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '6px 18px', borderRadius: '999px',
              fontSize: '18px', fontWeight: 500,
              background: POSTER_CONFIG.tagGray.bg, color: POSTER_CONFIG.tagGray.text,
              border: `1px solid ${POSTER_CONFIG.tagGray.border}`,
            }}>
              {locationTag}
            </span>
          )}
        </div>

        {/* 分割线 */}
        <div style={{ height: '1px', background: POSTER_CONFIG.border, marginBottom: '28px' }} />

        {/* 内容区 */}
        <div style={{ fontSize: '20px', color: POSTER_CONFIG.textBody }}>
          {descItems.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              {descItems.map((item, i) => (
                <p key={i} style={{ margin: '0 0 12px 0', lineHeight: 1.7 }}>{item}</p>
              ))}
            </div>
          )}
          {reqItems.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, color: POSTER_CONFIG.textMain, marginBottom: '12px', fontSize: '22px' }}>
                任职要求：
              </div>
              {reqItems.map((item, i) => (
                <p key={i} style={{ margin: '0 0 12px 0', lineHeight: 1.7 }}>{item}</p>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: '40px' }} />

        {/* 底部品牌区 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px 0 0', borderTop: `2px solid ${POSTER_CONFIG.primary}` }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '12px', background: POSTER_CONFIG.primaryLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            border: `2px solid ${POSTER_CONFIG.primary}`,
          }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: POSTER_CONFIG.primary }}>Q</span>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: POSTER_CONFIG.textMain, marginBottom: '4px' }}>
              圈圈翻译与本地化社群
            </div>
            <div style={{ fontSize: '18px', color: POSTER_CONFIG.textMuted }}>
              <span style={{ color: POSTER_CONFIG.primary, fontWeight: 600 }}>5700+</span> 同行交流 | 全语种
              <span style={{ color: POSTER_CONFIG.primary, fontWeight: 600 }}>内部</span> 招募 |
              <span style={{ color: POSTER_CONFIG.primary, fontWeight: 600 }}>700+</span> 行业红黑榜
            </div>
            <div style={{ fontSize: '16px', color: POSTER_CONFIG.primary, marginTop: '4px', fontWeight: 500 }}>
              年度会员 ¥299 无限解锁
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

SharePoster.displayName = 'SharePoster';

export default SharePoster;
