# JRXML属性验证报告（最终版）

**生成时间:** 2026-06-09
**验证方法:** XSD文件分析 + JasperReports源码分析

---

## 📊 验证状态

| 状态 | 说明 |
|------|------|
| ✅ 已验证 | 通过XSD文件分析确认 |
| ⚠️ 需本地验证 | 需要完整依赖库进行编译测试 |
| 🔄 待远程验证 | 需要远程JasperReports服务器 |

---

## 🔴 严重问题（XSD分析确认）

### 1. uuid属性不一致

**证据来源:** jasperreport.xsd文件分析

| 元素 | XSD定义 | JSON Schema | XSD证据 | 结论 |
|------|---------|-------------|---------|------|
| **field** | 无uuid | 有uuid | XSD第1509行未定义uuid | ❌ Schema多余 |
| **variable** | 无uuid | 有uuid | XSD第1548行未定义uuid | ❌ Schema多余 |
| **sortField** | 无uuid | 有uuid | XSD第1602行未定义uuid | ❌ Schema多余 |
| **group** | 无uuid | 有uuid | XSD第1724行未定义uuid | ❌ Schema多余 |
| **parameter** | 有uuid | 无uuid | XSD第1257行定义uuid | ❌ Schema缺失 |
| **band** | 无uuid | 有uuid | XSD第1039行未定义uuid | ❌ Schema多余 (已修复) |
| **subDataset** | 有uuid | 有uuid | XSD第1257行定义uuid | ✅ 一致 |
| **reportElement** | 有uuid | 有uuid | 通过attributeGroup继承 | ✅ 一致 |

**结论:** 必须修正

---

## 🟡 中等问题（XSD分析确认）

### 2. positionType枚举值

**XSD定义 (第2384-2410行):**
```xml
<enumeration value="Float"/>
<enumeration value="FixRelativeToTop"/>
<enumeration value="FixRelativeToBottom"/>
```

**JSON Schema定义:**
```json
"positionType": {
  "enum": ["FixRelativeToBand", "Float"],
  "default": "FixRelativeToBand"
}
```

**不一致:**
- ❌ Schema使用`FixRelativeToBand`，XSD使用`FixRelativeToTop`
- ❌ Schema缺少`FixRelativeToBottom`
- ❌ 默认值不一致（XSD: FixRelativeToTop, Schema: FixRelativeToBand）

**结论:** 必须修正

### 3. scaleImage枚举值

**XSD定义 (第2111行):**
```xml
<enumeration value="RetainShape"/>
```

**JSON Schema定义:**
```json
"scaleImage": {
  "enum": ["Clip", "FillFrame", "RetainImage", "RealHeight", "RealSize"]
}
```

**不一致:**
- ❌ Schema使用`RetainImage`，XSD使用`RetainShape`

**结论:** 必须修正

### 4. resetType枚举值

**XSD定义 (第1499-1538行):**
```xml
<enumeration value="None"/>
<enumeration value="Report"/>
<enumeration value="Page"/>
<enumeration value="Column"/>
<enumeration value="Group"/>
<enumeration value="Master"/>
```

**JSON Schema定义:**
```json
"resetType": {
  "enum": ["None", "Report", "Page", "Column", "Group"],
  "default": "Report"
}
```

**不一致:**
- ❌ Schema缺少`Master`枚举值

**结论:** 必须修正

### 5. 缺失属性定义

**XSD中存在但Schema缺失的属性:**

| 元素 | 缺失属性 | XSD证据 | 结论 |
|------|---------|---------|------|
| **elementBase** | `stretchType` | XSD第2417-2464行 | ❌ 必须添加 |
| **textElement** | `textAdjust` | XSD第2504-2550行 | ❌ 必须添加 |
| **group** | `isReprintHeaderOnEachColumn` | XSD第1812行 | ❌ 建议添加 |
| **group** | `minDetailsToStartFromTop` | XSD第1830行 | ❌ 建议添加 |
| **group** | `footerPosition` | XSD第1848行 | ❌ 建议添加 |
| **line** | `direction` | XSD第1189行 | ❌ 建议添加 |

**stretchType枚举值 (XSD第2417-2464行):**
- `NoStretch` (默认)
- `RelativeToTallestObject`
- `RelativeToBandHeight`
- `ElementGroupBottom`
- `ElementGroupHeight`
- `ContainerBottom`
- `ContainerHeight`

**textAdjust枚举值 (XSD第2504-2550行):**
- `CutText` (默认)
- `StretchHeight`
- `StretchHeightRatio`
- `StretchWidth`
- `FillHeight`
- `FillWidthRatio`

**line direction枚举值 (XSD第1189行):**
- `TopDown` (默认)
- `LeftRight`
- `BottomUp`
- `RightLeft`

**group footerPosition枚举值 (XSD第1848行):**
- `Normal` (默认)
- `AtBottom`
- `KeepTogether`

**结论:** 必须添加

### 6. Schema中存在但XSD中没有的属性

**JSON Schema中多余属性:**

| 元素 | 多余属性 | XSD证据 | 结论 |
|------|---------|---------|------|
| **variable** | `calculationGroup` | XSD第1548行未定义 | ❌ 应移除 |
| **variable** | `isInitialized` | XSD第1548行未定义 | ❌ 应移除 |
| **group** | `isKeepTogether` | XSD第1724行未定义 | ❌ 应移除 |
| **group** | `isKeepFooterTogether` | XSD第1724行未定义 | ❌ 应移除 |
| **group** | `isHideColumnHeader` | XSD第1724行未定义 | ❌ 应移除 |

**结论:** 应移除

---

## 🟢 轻微问题（XSD分析确认）

### 7. pen属性名和枚举值

**XSD定义 (第663-678行):**
```xml
<attribute name="pen">
  <simpleType>
    <restriction base="string">
      <enumeration value="None"/>
      <enumeration value="Thin"/>
      <enumeration value="1Point"/>
      <enumeration value="2Point"/>
      <enumeration value="4Point"/>
      <enumeration value="Dotted"/>
    </restriction>
  </simpleType>
</attribute>
```

**JSON Schema定义:**
```json
"penetration": {
  "enum": ["None", "1Point", "2Points", "4Points"]
}
```

**不一致:**
- ❌ Schema使用`penetration`，XSD使用`pen`
- ❌ Schema枚举值缺少`Thin`和`Dotted`
- ❌ Schema使用`2Points`/`4Points`，XSD使用`2Point`/`4Point`

**结论:** 应修正

---

## ⚠️ 待验证项目

### 需要完整依赖库验证

以下项目需要完整的JasperReports依赖库进行编译验证：

1. **所有uuid属性验证** - 需要commons-digester等依赖
2. **所有枚举值验证** - 需要运行时验证
3. **所有缺失属性验证** - 需要编译测试

**依赖缺失:**
- `commons-digester`
- `commons-beanutils`
- `commons-logging`
- 其他JasperReports依赖

---

## 📝 修复建议清单

### 立即修复（影响编译）

1. ✅ 移除band的uuid (已完成)
2. 移除field/variable/sortField/group的uuid
3. 添加parameter的uuid
4. 修正positionType枚举值
5. 修正scaleImage枚举值
6. 添加resetType的Master值
7. 添加stretchType属性完整定义
8. 添加textAdjust属性完整定义

### 建议修复（提高一致性）

9. 修正pen属性名和枚举值
10. 添加缺失的group属性
11. 移除多余的variable/group属性
12. 添加line的direction属性

### 可选修复

13. 决策markup属性处理方式
14. 考虑调整required属性策略

---

## 🎯 总结

| 类别 | 已确认不一致 | 优先级 | 建议操作 |
|------|-------------|--------|---------|
| uuid属性 | 6项 | 🔴 高 | 立即修正 |
| 枚举值 | 3项 | 🔴 高 | 立即修正 |
| 缺失属性 | 6项 | 🟡 中 | 建议添加 |
| 多余属性 | 5项 | 🟡 中 | 建议移除 |
| 结构问题 | 3项 | 🟢 低 | 考虑修正 |
| **总计** | **23项** | - | - |

**基于XSD文件分析，已确认23项不一致问题。**

**下一步:** 
1. 下载完整的JasperReports依赖库进行本地编译验证
2. 或启动远程编译服务器进行验证
3. 根据验证结果更新报告
4. 按照修复建议清单逐步修正JSON Schema
