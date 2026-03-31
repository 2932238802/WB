import { Chart, registerables } from 'chart.js'
import * as XLSX from 'xlsx'
import { markRaw } from 'vue'
import OpenAI from 'openai'
import { marked } from 'marked'

Chart.register(...registerables)

const MY_API_KEY = 'sk-de81e7d4efaf432f8c7b785b2fd9e289' 
const MY_BASE_URL = 'https://api.deepseek.com' 
const MY_MODEL_NAME = 'deepseek-chat' 

const openai = new OpenAI({
  baseURL: MY_BASE_URL,
  apiKey: MY_API_KEY,
  dangerouslyAllowBrowser: true 
})

export default {
  name: 'AnkleAnalysis',

  data() {
    return {
      isConnected: true,
      currentTime: '',
      aiLoading: false,
      aiAdviceText: '',

      excelFileInfo: '',
      excelTotalRows: 0,
      excelGroupCount: 0,
    }
  },

  computed: {
    formattedAiAdvice() {
      if (!this.aiAdviceText) return ''
      return marked(this.aiAdviceText)
    }
  },

  created() {
    this.charts = {}
  },

  mounted() {
    this.updateTime()
    setInterval(this.updateTime, 1000)
    this.$nextTick(() => { this.initCharts() })
  },

  beforeUnmount() {
    Object.values(this.charts).forEach(c => c.destroy())
  },

  methods: {
    updateTime() {
      const now = new Date()
      this.currentTime = now.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    },

    initCharts() {
      const themeBlack = '#111'
      const themeYellow = '#FFB800'
      const gridColor  = 'rgba(0,0,0,0.04)'

      const baseOpts = () => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#555', font: { size: 12, family: 'sans-serif' }, maxTicksLimit: 8 },
            grid:  { color: gridColor }
          },
          y: {
            ticks: { color: '#555', font: { size: 12, family: 'sans-serif' } },
            grid:  { color: gridColor }
          }
        }
      })

      const makeDataset = (color, bgColor, label) => ({
        label,
        data: [],
        borderColor: color,
        backgroundColor: bgColor,
        borderWidth: 3,
        pointRadius: 1, 
        spanGaps: true, 
        fill: true,
        tension: 0.4
      })

      this.charts.rawAngle = markRaw(new Chart(this.$refs.rawAngleChart, {
        type: 'line',
        data: { labels: [], datasets: [makeDataset(themeBlack, 'rgba(255, 184, 0, 0.15)', '角度')] },
        options: baseOpts()
      }))
    },

    clearRawData() {
      this.excelFileInfo  = ''
      this.excelTotalRows = 0
      this.excelGroupCount = 0
      this.aiAdviceText = ''
      
      const chart = this.charts.rawAngle
      if (chart) {
        chart.data.labels = []
        chart.data.datasets[0].data = []
        chart.update()
      }
    },

    handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      event.target.value = ''
      this.clearRawData()

      const reader = new FileReader()
      if (file.name.endsWith('.txt')) {
        reader.onload = (e) => {
          const text = e.target.result
          const lines = text.split('\n')
          const rows = lines.map(line => line.trim().split(/\s+/))
          this.excelFileInfo = file.name
          this.parseAndDrawExcel(rows)
        }
        reader.readAsText(file)
        return
      }

      reader.onload = (e) => {
        const data     = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet    = workbook.Sheets[workbook.SheetNames[0]]
        const rows     = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        this.excelFileInfo = file.name
        this.parseAndDrawExcel(rows)
      }
      reader.readAsArrayBuffer(file)
    },

    parseAndDrawExcel(rows) {
      if (!rows || rows.length === 0) {
        alert('数据为空或格式不正确')
        return
      }

      let dataRows = rows
      const firstRow = rows[0]
      if (firstRow && firstRow.length >= 2) {
         const t = String(firstRow[0]).replace(/[^\d.-]/g, '')
         const v = String(firstRow[1]).replace(/[^\d.-]/g, '')
         if (isNaN(Number(t)) || isNaN(Number(v)) || t === '' || v === '') {
             dataRows = rows.slice(1)
         }
      }

      this.excelTotalRows = dataRows.length
      const parsedData = []

      for (const row of dataRows) {
        if (!row || row.length < 2) continue
        
        let tsStr = String(row[0]).trim()
        let valStr = String(row[1]).replace(/[^\d.-]/g, '')

        if (tsStr.startsWith('ai')) tsStr = tsStr.replace('ai', '')
        tsStr = tsStr.replace(/[^\d.-]/g, '') 

        if (tsStr === '' || valStr === '') continue

        const tsNum  = Number(tsStr)
        const valNum = Number(valStr)
        if (isNaN(tsNum) || isNaN(valNum)) continue

        parsedData.push({ ts: tsNum, val: valNum })
      }

      parsedData.sort((a, b) => a.ts - b.ts)

      const MAX_POINTS = 1500
      let finalData = []

      if (parsedData.length > MAX_POINTS) {
        const chunkSize = Math.ceil(parsedData.length / MAX_POINTS)
        for (let i = 0; i < parsedData.length; i += chunkSize) {
          const chunk = parsedData.slice(i, i + chunkSize)
          const avgVal = chunk.reduce((sum, item) => sum + (item.val || 0), 0) / chunk.length
          finalData.push({ ts: chunk[0].ts, val: avgVal })
        }
      } else {
        finalData = parsedData
      }

      this.excelGroupCount = finalData.length

      const labels     = []
      const pitchAvgs  = []

      for (const item of finalData) {
        const ts = item.ts
        const avg = item.val || 0

        const ms      = ts.toString().length >= 10 && ts.toString().length < 13 ? ts * 1000 : ts
        const date    = new Date(ms)
        const timeStr = date.toLocaleTimeString('zh-CN', {
          hour:   '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })

        labels.push(timeStr)
        pitchAvgs.push(+avg.toFixed(3))
      }

      const chart = this.charts.rawAngle
      chart.data.labels                    = labels
      chart.data.datasets[0].data          = pitchAvgs
      chart.data.datasets[0].label         = 'Pitch角均值 (°)'
      chart.update('none') 
    },

    async getAiAdvice() {
      const chart = this.charts.rawAngle
      const dataPoints = chart?.data?.datasets[0]?.data || []
      
      if (!dataPoints || dataPoints.length === 0) {
        alert('温馨提示：请先导入您的康复数据，AI 才能为您分析哦！')
        return
      }
      if (!MY_API_KEY) {
        alert('请在代码 (src/components/AnkleAnalysis.js 第9行) 中填入您的 API Key！')
        return
      }

      this.aiLoading = true
      this.aiAdviceText = ''

      const maxAngle = Math.max(...dataPoints)
      const minAngle = Math.min(...dataPoints)
      const avgAngle = dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length

      const systemPrompt = `你是一名资深且极其耐心的骨科与智能康复医学专家，正在面对一位老年康复患者。
患者刚刚完成了踝关节的步态训练，以下是设备采集到的踝关节 Pitch角（即背屈/跖屈角度）统计：
- 最大活动角度: ${maxAngle.toFixed(2)}°
- 最小活动角度: ${minAngle.toFixed(2)}°
- 平均活动角度: ${avgAngle.toFixed(2)}°
- 运动采样点: ${dataPoints.length} 个

请你根据以上数据，给出一段专业、温暖、充满人文关怀且通俗易懂的康复评估与建议。
注意要求：
1. 用字要大方、用词要通俗，像和蔼的医生面对面叮嘱一样，多鼓励患者。
2. 评估当前的关节活动度（正常步行通常背屈10°~15°，跖屈15°~20°），告诉老人家表现怎么样，哪里好，哪里还需要加油。
3. 给出1~2个在家里就能做的简单康复动作指导。
4. 使用 Markdown 分段，总字数控制在 300 字左右，不要废话。`

      try {
        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "医生您好，这是我今天的踝关节训练数据，请帮我看看练得怎么样？" }
          ],
          model: MY_MODEL_NAME,
          temperature: 0.7,
          max_tokens: 800
        });

        if (completion.choices && completion.choices.length > 0) {
          this.aiAdviceText = completion.choices[0].message.content
        } else {
          this.aiAdviceText = "AI 暂时没能生成建议，请稍后再试。"
        }
      } catch (error) {
        this.aiAdviceText = `⚠️ 哎呀，分析暂时中断了。\n原因可能是：您的 API Key 不正确，或者网络环境拦截了请求。\n\n详细错误: ${error.message}`
      } finally {
        this.aiLoading = false
      }
    }
  }
}