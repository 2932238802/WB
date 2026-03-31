<template>
  <div class="page bw-theme">

    <div class="bg-effects">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
    </div>

    <header class="header float-anim">
      <div class="header-left">
        <span class="header-icon pulse-anim">💛</span>
        <div>
          <h1 class="header-title">分析</h1>
        </div>
      </div>
      <div class="header-right">
        <span class="status-text">{{ isConnected ? '已连接' : '未连接' }}</span>
        <span class="header-time">{{ currentTime }}</span>
      </div>
    </header>

    <main class="main">
      <section class="card slide-up-anim">
        <div class="card-header">
          <div class="card-title-wrap">
            <span class="card-num">01</span>
            <span class="card-title">运动数据</span>
          </div>
          <div class="card-actions">
            <label class="btn-outline" style="cursor:pointer;" title="支持 Excel / Txt 格式">
              📁 导入数据
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.txt"
                style="display:none"
                @change="handleFileUpload"
              />
            </label>
            <button class="btn-outline" @click="clearRawData">🗑 重新开始</button>
          </div>
        </div>
        <div class="card-body">
          <transition name="fade">
            <div v-if="excelFileInfo" class="file-info-bar">
              <span>📄 已读取文件：<strong class="highlight-text">{{ excelFileInfo }}</strong></span>
              <span class="file-info-stat">总共 {{ excelTotalRows }} 条数据 → 优化展示为 {{ excelGroupCount }} 个关键点</span>
            </div>
          </transition>

          <div class="chart-row">
            <div class="chart-item chart-item-wide">
              <div class="chart-label">踝关节弯曲角度 (Pitch角)</div>
              <div class="canvas-wrapper">
                <canvas ref="rawAngleChart" class="chart-canvas"></canvas>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="card slide-up-anim" style="animation-delay: 0.15s;">
        <div class="card-header">
          <div class="card-title-wrap">
            <span class="card-num">02</span>
            <span class="card-title">医生智能康复建议</span>
          </div>
          <div class="card-actions api-controls">
            <button class="btn-primary" @click="getAiAdvice" :disabled="aiLoading">
              <span v-if="aiLoading" class="loading-spinner"></span>
              {{ aiLoading ? ' thinking...' : '获取康复指导' }}
            </button>
          </div>
        </div>
        <div class="card-body">
          <transition name="fade" mode="out-in">
            <div v-if="aiLoading" class="ai-loading" key="loading">
              <div class="loading-dots">
                <span></span><span></span><span></span>
              </div>
              <p class="loading-text">wait ...</p>
            </div>
            
            <div v-else-if="aiAdviceText" class="ai-content" key="content">
              <div class="ai-text-box">
                <div class="ai-avatar">👨‍⚕️</div>
                <div class="ai-message">{{ aiAdviceText }}</div>
              </div>
            </div>
            
            <div v-else class="ai-empty" key="empty">
              <div class="empty-icon float-anim">💛</div>
              <p>导入 然后 建议</p>
            </div>
          </transition>
        </div>
      </section>

    </main>

    <footer class="footer">
      <span>© LosAngelou 2026 | 关爱老年人健康 ~~~~ </span>
    </footer>

  </div>
</template>

<script src="./AnkleAnalysis.js"></script>

<style scoped>

.bw-theme {
  position: relative;
  background-color: #fafafa;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  min-height: 100vh;
  padding: 30px;
  box-sizing: border-box;
  overflow-x: hidden;
}

.bg-effects {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  animation: floatBackground 15s ease-in-out infinite alternate;
}
.shape-1 {
  width: 600px; height: 600px;
  background: #ffe38a;
  top: -100px; right: -100px;
}
.shape-2 {
  width: 500px; height: 500px;
  background: #f0f0f0;
  bottom: -150px; left: -100px;
  animation-delay: -5s;
}

@keyframes floatBackground {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-30px, 50px) scale(1.1); }
}

/* 将主要内容置于最上层 */
.header, .main, .footer { position: relative; z-index: 1; }

/* 2. 动画类 */
.float-anim { animation: floating 4s ease-in-out infinite; }
@keyframes floating {
  0% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0); }
}

.pulse-anim { animation: pulsing 2s infinite; display: inline-block; }
@keyframes pulsing {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

.slide-up-anim {
  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(30px);
}
@keyframes slideUp {
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 3. Header */
.header {
  display: flex; justify-content: space-between; align-items: center;
  background: #111; color: #fff;
  padding: 24px 32px; border-radius: 16px; margin-bottom: 28px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.15), 0 0 0 2px rgba(255, 184, 0, 0.2);
  transition: box-shadow 0.4s ease;
}
.header:hover { box-shadow: 0 12px 30px rgba(0,0,0,0.2), 0 0 0 2px rgba(255, 184, 0, 0.8); }
.header-left { display: flex; align-items: center; gap: 16px; }
.header-icon { font-size: 38px; }
.header-title { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px; color: #fff; }
.header-sub { margin: 6px 0 0; font-size: 14px; color: #FFB800; letter-spacing: 2px; }
.header-right { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 500;}
.status-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
.status-dot.connected { background: #FFB800; box-shadow: 0 0 12px #FFB800; }
.status-dot.disconnected { background: #555; }
.header-time { background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 8px; letter-spacing: 1px;}

/* 4. Cards */
.card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid #eaeaea;
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 28px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.04);
  transition: transform 0.4s ease, box-shadow 0.4s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.08);
}
.card-header {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 3px solid #111; padding-bottom: 16px; margin-bottom: 24px;
}
.card-title-wrap { display: flex; align-items: center; }
.card-num { font-size: 34px; font-weight: 900; color: #FFB800; margin-right: 14px; font-family: Tahoma, sans-serif; text-shadow: 1px 1px 0 #111;}
.card-title { font-size: 24px; font-weight: 700; color: #111; }
.card-badge { font-size: 14px; padding: 6px 12px; border: 2px solid #111; border-radius: 20px; margin-left: 16px; font-weight: bold; background: #fff;}
.badge-dark { background: #111; color: #FFB800; border-color: #111;}

/* 5. Buttons */
.btn-outline {
  background: #fff; border: 2px solid #111; color: #111; padding: 10px 20px;
  border-radius: 8px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600; font-size: 16px; margin-left: 12px;
}
.btn-outline:hover { background: #111; color: #FFB800; transform: scale(1.05); }

.btn-primary {
  background: #FFB800; color: #111; border: none; padding: 12px 28px;
  border-radius: 8px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 700; font-size: 18px; display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 15px rgba(255, 184, 0, 0.3);
}
.btn-primary:hover:not(:disabled) {
  background: #f0ad00; transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(255, 184, 0, 0.5);
}
.btn-primary:disabled { background: #e0e0e0; color: #888; box-shadow: none; cursor: not-allowed; }

/* 6. Info Bar & Charts */
.file-info-bar {
  background: #fff8e1; border-left: 6px solid #FFB800; padding: 16px 20px; margin-bottom: 24px;
  font-size: 16px; display: flex; justify-content: space-between; border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 10px rgba(255, 184, 0, 0.1);
}
.highlight-text { color: #111; font-weight: bold; font-size: 18px; }
.file-info-stat { color: #555; font-weight: 600; }

.chart-row { display: flex; flex-wrap: wrap; }
.chart-item {
  flex: 1; background: #fff; border: 2px solid #f0f0f0; border-radius: 12px;
  padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}
.chart-label { font-size: 18px; font-weight: 700; margin-bottom: 16px; text-align: center; color: #111; }
.canvas-wrapper { height: 420px; width: 100%; position: relative; }
.chart-canvas { width: 100% !important; height: 100% !important; }

/* 7. AI Content Area */
.ai-text-box {
  display: flex; gap: 20px;
  background: #fff; border: 2px solid #111; padding: 28px; border-radius: 16px;
  box-shadow: 6px 6px 0 rgba(255, 184, 0, 1); /* 硬阴影提升立体感 */
}
.ai-avatar { font-size: 48px; }
.ai-message {
  flex: 1; font-size: 18px; color: #222; line-height: 1.8;
  font-weight: 500; font-family: system-ui, sans-serif;
}

/* 针对 Markdown 的样式美化 */
:deep(.markdown-body p) { margin: 0 0 12px 0; }
:deep(.markdown-body ul), :deep(.markdown-body ol) { margin: 0 0 16px 24px; padding: 0; }
:deep(.markdown-body li) { margin-bottom: 8px; }
:deep(.markdown-body strong) { 
  color: #111; font-weight: 800; 
  background: rgba(255, 184, 0, 0.4); 
  padding: 2px 6px; border-radius: 4px; 
}
:deep(.markdown-body h1), :deep(.markdown-body h2), :deep(.markdown-body h3) { 
  color: #111; margin: 24px 0 12px; font-weight: 800; 
  border-bottom: 2px solid #eee; padding-bottom: 6px; display: inline-block; 
}
:deep(.markdown-body blockquote) { 
  margin: 0 0 16px; padding-left: 16px; border-left: 5px solid #FFB800; 
  color: #555; background: #fff8e1; padding: 12px 16px; border-radius: 0 8px 8px 0;
}

.ai-empty { text-align: center; padding: 50px 0; color: #666; font-size: 18px; font-weight: 500;}
.empty-icon { font-size: 56px; margin-bottom: 20px; }

/* Loading Animation */
.ai-loading { text-align: center; padding: 60px 0; color: #111; }
.loading-text { font-size: 18px; font-weight: 600; margin-top: 16px; }
.loading-dots span {
  display: inline-block; width: 12px; height: 12px; background: #FFB800; border-radius: 50%;
  margin: 0 6px; animation: pulseDots 1.4s infinite ease-in-out both;
}
.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }
@keyframes pulseDots {
  0%, 80%, 100% { transform: scale(0); opacity: 0.3;}
  40% { transform: scale(1); opacity: 1;}
}
.loading-spinner {
  display: inline-block; width: 16px; height: 16px; border: 3px solid rgba(0,0,0,0.1);
  border-radius: 50%; border-top-color: #111; animation: spin 1s ease-in-out infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 8. Footer */
.footer { text-align: center; margin-top: 50px; margin-bottom: 20px; color: #888; font-size: 15px; font-weight: 500; letter-spacing: 1px; }
</style>