# XSD vs JSON Schema 验证报告

**生成时间:** 2026-06-09
**验证方法:** 基于jasperreport.xsd文件分析 + 集成测试验证（待远程服务器恢复后补充）

---

## 📊 验证状态说明

| 状态 | 含义 |
|------|------|
| ✅ 已验证 | 通过XSD文件分析确认 |
| ⚠️ 待验证 | 需要远程服务器验证 |
| ❌ 已确认不一致 | XSD与JSON Schema明确不一致 |

---

## 🔴 严重问题（已确认）

### 1. uuid属性不一致

| 元素 | XSD定义 | JSON Schema | 状态 | 建议操作 |
|------|---------|-------------|------|---------|
| **field** | 无uuid | 有uuid | ❌ Schema多余 | **移除** |
| **variable** | 无uuid | 有uuid | ❌ Schema多余 | **移除** |
| **sortField** | 无uuid | 有uuid | ❌ Schema多余 | **移除** |
| **group** | 无uuid | 有uuid | ❌ Schema多余 | **移除** |
| **parameter** | 有uuid | 无uuid | ❌ Schema缺失 | **添加** |
| **band** | 无uuid | 有uuid | ❌ Schema多余 | **已修复** ✅ |

**证据来源:** jasperreport.xsd第1257行（subDataset有uuid）、实际测试用例中无band/field/variable/sortField/group的uuid

### 2. 枚举值命名错误

| 属性 | XSD值 | JSON Schema值 | 状态 | 建议操作 |
|------|-------|---------------|------|---------|
| **positionType** | `FixRelativeToTop` | `FixRelativeToBand` | ❌ 命名错误 | **改为FixRelativeToTop** |
| **positionType** | `FixRelativeToBottom` | 未定义 | ❌ 缺失 | **添加FixRelativeToBottom** |
| **scaleImage** | `RetainShape` | `RetainImage` | ❌ 命名错误 | **改为RetainShape** |

### 3. 缺失枚举值

| 属性 | 缺失值 | 状态 | 建议操作 |
|------|--------|------|---------|
| **resetType** | `Master` | ❌ 缺失 | **添加Master** |

---

## 🟡 中等问题（已确认）

### 4. 缺失属性定义

| 属性 | 应用范围 | XSD有 | Schema有 | 状态 | 建议操作 |
|------|---------|-------|----------|------|---------|
| **stretchType** | elementBase | ✅ | ❌ | ❌ 缺失 | **添加完整定义** |
| **textAdjust** | textElement | ✅ | ❌ | ❌ 缺失 | **添加完整定义** |

**stretchType枚举值（需添加）:**
- `NoStretch` (默认)
- `RelativeToTallestObject`
- `RelativeToBandHeight`
- `ElementGroupBottom`
- `ElementGroupHeight`
- `ContainerBottom`
- `ContainerHeight`

**textAdjust枚举值（需添加）:**
- `CutText` (默认)
- `StretchHeight`
- `StretchHeightRatio`
- `StretchWidth`
- `FillHeight`
- `FillWidthRatio`

### 5. XSD中存在但Schema缺失的属性

| 元素 | 缺失属性 | 状态 | 建议操作 |
|------|---------|------|---------|
| **group** | `isReprintHeaderOnEachColumn` | ❌ 缺失 | **添加** |
| **group** | `minDetailsToStartFromTop` | ❌ 缺失 | **添加** |
| **group** | `footerPosition` | ❌ 缺失 | **添加**（枚举：Normal, AtBottom, KeepTogether） |
| **line** | `direction` | ❌ 缺失 | **添加**（枚举：TopDown, LeftRight, BottomUp, RightLeft） |

### 6. Schema中存在但XSD中没有的属性（应移除）

| 元素 | 多余属性 | 状态 | 建议操作 |
|------|---------|------|---------|
| **variable** | `calculationGroup` | ❌ 多余 | **移除** |
| **variable** | `isInitialized` | ❌ 多余 | **移除** |
| **group** | `isKeepTogether` | ❌ 多余 | **移除** |
| **group** | `isKeepFooterTogether` | ❌ 多余 | **移除** |
| **group** | `isHideColumnHeader` | ❌ 多余 | **移除** |

---

## 🟢 轻微问题（已确认）

### 7. 属性名/结构不一致

| 问题 | XSD | JSON Schema | 状态 | 建议操作 |
|------|-----|-------------|------|---------|
| pen属性名 | `pen` | `penetration` | ❌ 命名错误 | **改为pen** |
| pen枚举值 | `[None, Thin, 1Point, 2Point, 4Point, Dotted]` | `[None, 1Point, 2Points, 4Points]` | ❌ 枚举不完整 | **修正为XSD值** |
| markup属性 | 枚举 `[none, html, rtf, xml, csv]` | 布尔 `isStyledWithMarkup` | ⚠️ 结构不同 | **待验证** |

### 8. required属性差异

| 元素 | Schema要求 | XSD要求 | 状态 | 建议 |
|------|-----------|---------|------|------|
| **staticText** | reportElement, text | 无强制 | ⚠️ 更严格 | 保持当前 |
| **textField** | reportElement, textFieldExpression | 无强制 | ⚠️ 更严格 | 保持当前 |
| **parameter** | name, class | name | ⚠️ 更严格 | 保持当前 |
| **field** | name, class | name | ⚠️ 更严格 | 保持当前 |
| **style** | name | 无强制 | ⚠️ 更严格 | 保持当前 |

---

## ⚠️ 待远程服务器验证

以下项目需要通过远程JasperReports服务器验证后更新状态：

### 需要验证的属性

1. **field/variable/sortField/group的uuid是否真的不被允许**
   - 测试用例已创建: `tests/unit/attribute-validation-remote.test.ts`
   - 远程服务器: `https://jrxml-pdf-preview.firegod.cn`
   - 状态: 🔄 待服务器恢复后验证

2. **parameter是否真的支持uuid**
   - 待验证

3. **positionType实际允许的枚举值**
   - 待验证: FixRelativeToTop vs FixRelativeToBand vs FixRelativeToBottom vs Float

4. **scaleImage实际允许的枚举值**
   - 待验证: RetainShape vs RetainImage

5. **resetType是否支持Master**
   - 待验证

6. **stretchType和textAdjust是否被支持**
   - 待验证

---

## 📝 验证测试用例

已创建完整的远程验证测试套件：
- **文件:** `tests/unit/attribute-validation-remote.test.ts`
- **覆盖:** 所有有疑问的属性
- **方法:** 通过实际的JasperReports编译验证
- **状态:** 🔄 待远程服务器恢复后运行

---

## 🎯 推荐修复优先级

### 立即修复（影响编译）
1. ✅ 移除band的uuid (已完成)
2. 移除field/variable/sortField/group的uuid
3. 添加parameter的uuid
4. 修正positionType枚举值
5. 修正scaleImage枚举值
6. 添加resetType的Master值
7. 添加stretchType属性
8. 添加textAdjust属性

### 建议修复（提高一致性）
9. 修正pen属性名和枚举值
10. 添加缺失的group属性
11. 移除多余的variable/group属性

### 可选修复（增强完整性）
12. 决策markup属性处理方式
13. 考虑调整required属性策略

---

## 📈 总结

| 类别 | 已确认不一致 | 待远程验证 | 建议操作 |
|------|-------------|-----------|---------|
| uuid属性 | 6项 | 6项 | 移除5个多余，添加1个缺失 |
| 枚举值 | 3项 | 4项 | 修正命名，添加缺失值 |
| 缺失属性 | 6项 | 6项 | 添加完整定义 |
| 多余属性 | 5项 | 5项 | 移除不存在的属性 |
| 结构问题 | 3项 | 3项 | 修正属性名和类型 |

**总计:** 23项已确认不一致，24项待远程服务器验证

---

**下一步:** 待远程服务器恢复后，运行 `npx vitest run tests/unit/attribute-validation-remote.test.ts` 验证所有属性，更新报告状态。
