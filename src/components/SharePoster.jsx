import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import html2canvas from 'html2canvas';

const SharePoster = forwardRef(({ job }, ref) => {
  const posterRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!posterRef.current) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 900,
        height: 1200,
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

  // 格式化正文：提取要点，去掉编号
  const formatDescription = (text) => {
    if (!text) return [];
    // 去掉常见的列表标记（1. a. b. · • 等）
    let cleaned = text
      .replace(/\n+/g, '\n')
      .replace(/^\d+[\.、]\s*/gm, '')
      .replace(/^[a-zA-Z][\.、]\s*/gm, '')
      .replace(/^[·•]\s*/gm, '')
      .replace(/\s{2,}/g, ' ');
    
    // 按句子分割
    const sentences = cleaned.split(/[。！?]/).map(s => s.trim()).filter(s => s.length > 5);
    return sentences.slice(0, 4);
  };

  const descItems = formatDescription(job.fullDescription || job.description);
  const salaryText = job.salaryRange || job.salary || '';

  // 标签：公司类型 + 工作类型 + 地点
  const allTags = [];
  if (job.company) allTags.push(job.company);
  if (job.type && job.type.length > 0) {
    job.type.forEach(t => {
      if (t !== '内部' && t !== '公开') allTags.push(t);
    });
  }
  if (job.location) allTags.push(job.location);

  return (
    <div
      ref={posterRef}
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '900px',
        height: '1200px',
        background: '#ffffff',
        fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif',
        boxSizing: 'border-box',
        padding: '0',
        overflow: 'hidden',
      }}
    >
      {/* 主体卡片 */}
      <div
        style={{
          width: '820px',
          height: '1120px',
          margin: '40px',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          boxSizing: 'border-box',
          padding: '56px 48px 48px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* 右上角绿色状态点 */}
        <div style={{
          position: 'absolute',
          top: '48px',
          right: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#22c55e',
          }} />
          <span style={{ fontSize: '16px', color: '#22c55e', fontWeight: 500 }}>在招</span>
        </div>

        {/* 公司名 */}
        <div style={{
          fontSize: '22px',
          color: '#6b7280',
          fontWeight: 400,
          marginBottom: '20px',
          letterSpacing: '0.5px',
        }}>
          {job.company || '未知公司'}
        </div>

        {/* 职位标题 */}
        <div style={{
          fontSize: '44px',
          fontWeight: 800,
          color: '#111827',
          lineHeight: 1.2,
          marginBottom: '24px',
          letterSpacing: '-0.5px',
        }}>
          {job.title || '职位名称'}
        </div>

        {/* 薪资 */}
        {salaryText && (
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#ea580c',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
          }}>
            <span style={{ fontSize: '20px', fontWeight: 500, color: '#9ca3af' }}>薪资：</span>
            <span>{salaryText}</span>
          </div>
        )}

        {/* 标签行 */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '40px' }}>
          {allTags.map((t, i) => (
            <span key={i} style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 20px',
              borderRadius: '999px',
              fontSize: '18px',
              fontWeight: 500,
              background: i === 0 ? '#fff7ed' : '#f9fafb',
              color: i === 0 ? '#ea580c' : '#4b5563',
              border: `1.5px solid ${i === 0 ? '#fed7aa' : '#e5e7eb'}`,
            }}>
              {t}
            </span>
          ))}
        </div>

        {/* 分割线 */}
        <div style={{ height: '1px', background: '#f3f4f6', marginBottom: '36px' }} />

        {/* 正文区 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{
            fontSize: '22px',
            color: '#374151',
            lineHeight: 1.9,
          }}>
            {descItems.length > 0 ? (
              descItems.map((item, i) => (
                <p key={i} style={{ margin: '0 0 16px 0' }}>
                  {item}
                </p>
              ))
            ) : (
              <p style={{ color: '#9ca3af' }}>暂无详细岗位描述</p>
            )}
          </div>
        </div>

        {/* 底部分割线 */}
        <div style={{ height: '2px', background: '#fd8e2a', marginTop: '32px', marginBottom: '32px', borderRadius: '1px' }} />

        {/* 底部品牌区 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Q Logo */}
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: '#fff7ed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '3px solid #fd8e2a',
          }}>
            <span style={{ fontSize: '36px', fontWeight: 800, color: '#fd8e2a' }}>Q</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#111827',
              marginBottom: '8px',
              letterSpacing: '-0.3px',
            }}>
              圈圈翻译与本地化社群
            </div>
            <div style={{
              fontSize: '18px',
              color: '#6b7280',
              lineHeight: 1.6,
            }}>
              <span style={{ color: '#fd8e2a', fontWeight: 700 }}>5700+</span> 同行交流
              <span style={{ color: '#d1d5db', margin: '0 8px' }}>|</span>
              全语种<span style={{ color: '#fd8e2a', fontWeight: 700 }}>内部</span>招募
              <span style={{ color: '#d1d5db', margin: '0 8px' }}>|</span>
              <span style={{ color: '#fd8e2a', fontWeight: 700 }}>700+</span> 行业红黑榜
            </div>
            <div style={{
              fontSize: '16px',
              color: '#fd8e2a',
              marginTop: '8px',
              fontWeight: 600,
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
