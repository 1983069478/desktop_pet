# 🎨 真人定制桌面宠物 AI 生图与动效生成指南

> **核心思路**：以真人面部/发型特征为原型，通过 AI 生成 **阶段0（水晶蛋） $\rightarrow$ 阶段1（Q版幼体） $\rightarrow$ 阶段2（终极赛博形态）** 三组一致性图像，再通过图生视频 (Image-to-Video) 工具转为透明 GIF。

---

## 🛠️ 一、 角色一致性基础设定 (Character Consistency Keywords)

在各大 AI 生图工具（Midjourney / Flux / Stable Diffusion / SDXL）中，为了确保三个阶段的形象保持同一个人，请在提示词中加入以下**统一外观特征词 (Sub-prompts)**：

* **人物特征词 (替换为你朋友的特征)**：
  `chibi cute girl, dark brown twin-tails hair, round glasses, big expressive brown eyes, sweet smile`
* **统一渲染风格 (Style Anchor)**：
  `3D chibi anime character style, smooth clay lighting, Pop Mart blind box aesthetic, vibrant colors, isolated clean light background, centered framing, 8k resolution`

---

## 🪄 二、 三阶段 AI 生图提示词 (Prompts)

### 🥚 阶段 0：能量水晶蛋 (Stage 0: Crystal Egg / Seed)

* **设计概念**：一个充满科技与魔法感半透明水晶蛋，里面包裹着Q版真人的萌萌睡眠/蜷缩形态，四周飘浮着紫色 Monad 能量符文。
* **英文 Prompt (通用版)**：
  > `A cute 3D transparent crystal egg floating in the air, inside the egg sleeps a tiny chibi cute girl with dark brown twin-tails hair and round glasses, glowing purple neon energy lines inside, Monad purple runes and magical stardust particles floating around, glossy glass texture, soft studio lighting, isolated white background, Pop Mart style, 8k --ar 1:1`
* **提示词拆解**：
  * 主体：`transparent crystal egg floating in the air` (悬浮半透明水晶蛋)
  * 内置角色：`inside the egg sleeps a tiny chibi cute girl...` (蛋内睡觉的Q版女生)
  * 氛围光效应：`glowing purple neon energy lines, Monad purple runes` (紫色霓虹能量线与符文)

---

### 🐥 阶段 1：Q版破壳幼体 (Stage 1: Chibi Baby Pet)

* **设计概念**：真人破壳而出，变成二头身/三头身萌宠形态。身穿带猫耳/小兽角的可爱连体卫衣，坐在半破裂的水晶蛋壳上向用户挥手。
* **英文 Prompt (通用版)**：
  > `A cute 3D chibi girl sitting on a cracked glowing purple crystal eggshell, dark brown twin-tails hair, round glasses, wearing a cute purple cat-ear hoodie, happy big smile, waving hand to viewer, floating purple stars and magic sparkles around, vibrant colors, Pixar style 3D render, smooth lighting, isolated white background, 8k --ar 1:1`
* **提示词拆解**：
  * 姿态动作：`sitting on a cracked glowing purple crystal eggshell... waving hand` (坐在破裂水晶蛋壳上挥手)
  * 服装配饰：`wearing a cute purple cat-ear hoodie` (穿紫色猫耳卫衣)
  * 表情：`happy big smile` (开心大笑)

---

### 👑 阶段 2：终极进化·赛博女神 (Stage 2: Cyber Valkyrie / Ultimate Form)

* **设计概念**：高阶终极形态！真人升华为赛博女神/灵兽骑士，展开半透明紫罗兰能量双翼，悬浮着科技晶体，兼具萌感与硬核高贵质感。
* **英文 Prompt (通用版)**：
  > `An epic 3D chibi cyber valkyrie goddess, floating in mid-air, dark brown twin-tails hair with glowing futuristic hairpins, round glasses, wearing a glowing purple cybernetic armor and flowing translucent neon wings, floating magical Monad crystals around her, regal and cute expression, cinematic lighting, epic aura, isolated white background, Unreal Engine 5 render, 8k --ar 1:1`
* **提示词拆解**：
  * 高阶装备：`glowing purple cybernetic armor, flowing translucent neon wings` (发光紫色赛博铠甲与透明霓虹翅膀)
  * 环绕法器：`floating magical Monad crystals around her` (环绕悬浮的 Monad 晶体)
  * 气场：`regal and cute expression, epic aura` (高贵可爱的气场)

---

## 🎬 三、 从图片到桌面 GIF 的全套工作流 (Image-to-Video-to-GIF Workflow)

为你推荐一条效率最高、效果最好的制作流水线：

```text
[Step 1: AI 生图]           [Step 2: 图生视频]             [Step 3: 抠图转 GIF]          [Step 4: 放入 Electron]
Midjourney / Flux  ───►  Runway Gen-2 / Luma Dream Machine ───► Ezgif / Photoshop ───►  src/renderer/assets/
(生成高精静态图)             (生成 2-4 秒循环微动效)            (扣除背景导出透明 GIF)       (桌面宠物直接调用)
```

### 具体操作步骤：

1. **Step 1: 生成静态图 (Image Generation)**
   - 使用上述提示词在 Midjourney 或 Stable Diffusion 中生成最满意的一张静态图。
   - **技巧**：如果在 Midjourney 中，可以使用 `--cref [真人照片URL]` 选项强行锁定面部特征。

2. **Step 2: 图生视频 (Image-to-Video)**
   - 将静态图上传至 **Runway Gen-2** / **Luma Dream Machine** / **Kling AI (可灵)**。
   - 输入运动控制提示词 (Motion Prompt)：
     - **Stage 0 动效**：`gentle breathing, floating up and down smoothly, glowing lights pulsating, 4k, seamless loop`
     - **Stage 1 动效**：`chibi girl blinking, happy waving hand, slight body bounce, cute animation, seamless loop`
     - **Stage 2 动效**：`energy wings flapping gently, glowing particles falling, floating crystals rotating slowly, epic animation, seamless loop`

3. **Step 3: 背景抠除与转换为 GIF (Background Removal & GIF Conversion)**
   - 导出的视频放在在线工具 **[Unscreen](https://www.unscreen.com/)** 或 **[Ezgif](https://ezgif.com/)** 中。
   - 一键去除背景，将其转换为 `transparent GIF` (透明背景 GIF) 格式。

4. **Step 4: 放入 Electron 项目 (Integration)**
   - 将导出的 `stage_0.gif`, `stage_1.gif`, `stage_2.gif` 保存至项目 `src/renderer/src/assets/` 中。

---

## 🎯 四、 自定义照片生成符合项目要求 GIF 的【黄金提示词配方】

为了让你用自己照片生成出来的 GIF **能够无缝替换项目代码中的组件，且在桌面上无黑边、不卡顿、拖拽流畅**，在生图和生成视频时必须强制加入以下 **4 大合规限定词 (Constraints)**：

### 1. 静态图生成 (Midjourney / SD / Flux 提示词)

在以你的照片为参考图 (Image-to-Image / `--cref`) 时，提示词尾部必须加入：

```text
[你的角色特征描述], 3D chibi anime style, Pop Mart blind box aesthetic, pure solid white background, isolated on plain backdrop, centered full body view, generous space around character, no edge cropping, clean sharp outlines, studio lighting, 8k --ar 1:1
```

* **关键必备词解释**：
  * `pure solid white background`: 保证背景是纯白，这是后续抠图透明化的生命线！
  * `centered full body view`: 角色绝对居中全身，防止头部或肢体出框被截断。
  * `generous space around character`: 留白足够，避免在桌面摆动时撞上窗口边界。
  * `clean sharp outlines`: 边缘清晰无模糊杂影，方便抠图。

---

### 3. GIF 推荐生成时长与帧率设定

* **最佳推荐时长**：**`2 秒 ~ 3 秒`**（黄金时长为 **2.5 秒**）。
* **推荐帧率 (FPS)**：`15 FPS ~ 24 FPS`。

#### 为什么 2~3 秒最好？
1. **内存与性能最优**：透明背景 GIF 文件体积极大。2-3 秒的透明 GIF 体积一般在 **1MB - 3MB**，Electron 渲染极度流畅，CPU 占用低于 1%；如果生成 5 秒以上，GIF 体积可能暴涨至 15MB+，导致桌面拖拽卡顿。
2. **AI 首尾无缝衔接**：2-3 秒刚好容纳 **1 次完整的呼吸浮动** 或 **1-2 次眨眼**，在 Runway/可灵 中最容易实现首尾帧 100% 对齐，不会产生变形崩坏。
3. **低打扰悬浮体验**：桌面宠物待机频率不宜太长，2-3 秒一周期显得自然灵动。


