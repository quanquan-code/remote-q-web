import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import html2canvas from 'html2canvas';

const POSTER_CONFIG = {
  width: 900,
  height: 1200,
  scale: 2,
  bg: '#f6f7f9',
  cardBg: '#ffffff',
  primary: '#fd8e2a',
  primaryLight: '#fff7ed',
  textMain: '#1a1a2e',
  textBody: '#4a4a5a',
  textMuted: '#8a8a9a',
  border: '#f0f0f2',
  tagOrange: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  tagGray: { bg: '#f9fafb', text: '#4b5563', border: '#e5e7eb' },
};

const SharePoster = forwardRef(({ job }, ref) => {
  const posterRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const parseDescriptionItems = (text) => {
    if (!text) return [];
    const sentences = text.split(/[。！？\n]+/).map(s => s.trim()).filter(s => s.length > 8 && s.length < 120);
    return sentences.slice(0, 5);
  };

  const descItems = parseDescriptionItems(job.fullDescription || job.description || '');

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
        width: POSTER_CONFIG.width,
        height: POSTER_CONFIG.height,
      });

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 0.95);
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${job.company || '公司'}_${job.title || '职位'}_分享海报.png`;
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
  const locationTag = job.location || '';
  const salaryText = job.salaryRange || job.salary || '';

  const allTags = [
    ...typeTags,
    ...(locationTag ? [locationTag] : []),
  ].slice(0, 5);

  return (
    <div
      ref={posterRef}
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: `${POSTER_CONFIG.width}px`,
        height: `${POSTER_CONFIG.height}px`,
        background: POSTER_CONFIG.bg,
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif',
        boxSizing: 'border-box',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 白色卡片主体 */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: POSTER_CONFIG.cardBg,
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)',
          padding: '52px 44px 44px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 顶部：公司名 + 绿色状态点 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ fontSize: '22px', color: POSTER_CONFIG.textMuted, fontWeight: 500, letterSpacing: '0.5px' }}>
            {job.company || '未知公司'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px rgba(34,197,94,0.4)',
            }} />
            <span style={{ fontSize: '16px', color: '#22c55e', fontWeight: 500 }}>在招</span>
          </div>
        </div>

        {/* 大标题：职位名称 + 薪资 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '38px', fontWeight: 800, color: POSTER_CONFIG.textMain, lineHeight: 1.35, letterSpacing: '-0.3px' }}>
            {job.title || '职位名称'}
          </div>
          {salaryText && (
            <div style={{
              fontSize: '26px',
              fontWeight: 700,
              color: POSTER_CONFIG.primary,
              marginTop: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: POSTER_CONFIG.primaryLight,
              padding: '8px 20px',
              borderRadius: '12px',
            }}>
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#c2410c' }}>薪资：</span>
              <span>{salaryText}</span>
            </div>
          )}
        </div>

        {/* 标签行 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
          {allTags.map((t, i) => {
            const isOrange = i === 0 || t.includes('内部') || t.includes('急') || t.includes('全职');
            const style = isOrange ? POSTER_CONFIG.tagOrange : POSTER_CONFIG.tagGray;
            return (
              <span key={i} style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '7px 16px',
                borderRadius: '999px',
                fontSize: '17px',
                fontWeight: 500,
                background: style.bg,
                color: style.text,
                border: `1.5px solid ${style.border}`,
              }}>
                {t}
              </span>
            );
          })}
        </div>

        {/* 分割线 */}
        <div style={{ height: '2px', background: POSTER_CONFIG.border, marginBottom: '24px', borderRadius: '1px' }} />

        {/* 正文区 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontSize: '19px',
            color: POSTER_CONFIG.textBody,
            lineHeight: 1.75,
          }}>
            {descItems.length > 0 ? (
              descItems.map((item, i) => (
                <p key={i} style={{
                  margin: '0 0 14px 0',
                  textIndent: '2em',
                }}>
                  {item}
                </p>
              ))
            ) : (
              <p style={{ color: POSTER_CONFIG.textMuted, fontStyle: 'italic' }}>
                暂无详细岗位描述
              </p>
            )}
          </div>
        </div>

        {/* 底部分隔 */}
        <div style={{ height: '2px', background: POSTER_CONFIG.primary, marginTop: '24px', marginBottom: '24px', borderRadius: '1px' }} />

        {/* 底部品牌区 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {/* Q Logo */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: POSTER_CONFIG.primaryLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `3px solid ${POSTER_CONFIG.primary}`,
          }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: POSTER_CONFIG.primary }}>Q</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 800,
              color: POSTER_CONFIG.textMain,
              marginBottom: '6px',
              letterSpacing: '-0.2px',
            }}>
              圈圈翻译与本地化社群
            </div>
            <div style={{
              fontSize: '17px',
              color: POSTER_CONFIG.textMuted,
              lineHeight: 1.6,
            }}>
              <span style={{ color: POSTER_CONFIG.primary, fontWeight: 700 }}>5700+</span> 同行交流
              <span style={{ color: '#d1d5db', margin: '0 8px' }}>|</span>
              全语种<span style={{ color: POSTER_CONFIG.primary, fontWeight: 700 }}>内部</span>招募
              <span style={{ color: '#d1d5db', margin: '0 8px' }}>|</span>
              <span style={{ color: POSTER_CONFIG.primary, fontWeight: 700 }}>700+</span> 行业红黑榜
            </div>
            <div style={{
              fontSize: '15px',
              color: POSTER_CONFIG.primary,
              marginTop: '6px',
              fontWeight: 600,
              letterSpacing: '0.3px',
            }}>
              年度会员 ¥299 无限解锁
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

SharePoster.displayName = 'SharePoster';

export default SharePoster;
