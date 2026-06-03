# AI 生成代码规范

本文件定义了 AI 在本项目中生成 TypeScript / Vue 代码时**必须遵守**的规则。
违反任何一条都可能导致 `pnpm build`（`vue-tsc -b`）失败。

---

## 1. 严格模式与编译选项

本项目继承自 `@vue/tsconfig/tsconfig.dom.json`，以下选项已**默认开启**：

| 选项 | 含义 |
|------|------|
| `strict: true` | 所有严格检查 |
| `noUncheckedIndexedAccess: true` | **数组/对象索引返回 `T \| undefined`** |
| `verbatimModuleSyntax: true` | **`import` / `import type` 必须显式标注** |
| `noFallthroughCasesInSwitch: true` | switch 必须有 break / return |
| `erasableSyntaxOnly: true` | 仅允许可擦除的 TS 语法 |

---

## 2. `noUncheckedIndexedAccess` — 最常见的错误来源

> **数组索引 `arr[i]` 的类型为 `T | undefined`，即使 `i` 在运行时一定有效。**

### ❌ 错误写法

```ts
for (let i = 0; i < children.length; i++) {
  if (children[i].uuid === targetUuid) {  // TS2532: Object is possibly 'undefined'
    return { parent: children, index: i };
  }
}
```

### ✅ 正确写法（推荐：提取局部变量 + 空值守卫）

```ts
for (let i = 0; i < children.length; i++) {
  const child = children[i];
  if (!child) continue;
  if (child.uuid === targetUuid) {
    return { parent: children, index: i };
  }
}
```

### ✅ 也可使用 `!` 非空断言（仅在你能 100% 保证非空时）

```ts
const first = arr[0]!;  // 仅当 arr.length > 0 已被验证时使用
```

### 常见踩坑场景

- `for...of` 循环中按索引访问 `arr[i]`
- `Record<string, T>` 的 `obj[key]` 访问
- `Array.prototype.find()` 返回 `T | undefined`
- 正则匹配 `match[1]` 返回 `string | undefined`

---

## 3. `verbatimModuleSyntax` — 类型导入必须用 `import type`

> **普通 `import` 会被保留在输出中，可能导致运行时错误。类型导入必须使用 `import type`。**

### ❌ 错误写法

```ts
import { TableElement, Column } from '@/types';  // 如果只用于类型标注
```

### ✅ 正确写法

```ts
import type { TableElement, Column } from '@/types';
```

### 混合导入

```ts
import { SomeClass } from './module';        // 值，保留
import type { SomeType } from './module';     // 类型，擦除
```

---

## 4. 数组/对象操作的安全模式

### 4.1 数组元素交换

```ts
// ❌ 可能产生 undefined
const temp = parent[index];
parent[index] = parent[targetIndex];   // parent[targetIndex] 可能是 undefined
parent[targetIndex] = temp;            // temp 可能是 undefined

// ✅ 先取出再检查
const a = parent[index];
const b = parent[targetIndex];
if (a && b) {
  parent[index] = b;
  parent[targetIndex] = a;
}
```

### 4.2 Object.assign 用于索引结果

```ts
// ❌ result.parent[result.index] 可能是 undefined
Object.assign(result.parent[result.index], updates);

// ✅ 提取变量并守卫
const node = result.parent[result.index];
if (node) {
  Object.assign(node, updates);
}
```

### 4.3 正则匹配

```ts
const match = expr.match(/\$F\{(\w+)\}/);

// ❌ match[1] 可能是 undefined
fields.push({ name: match[1], label: match[1] });

// ✅ 先检查 match[1]
if (match && match[1] && !seen.has(match[1])) {
  fields.push({ name: match[1], label: match[1] });
}
```

---

## 5. 函数参数与返回值

### 5.1 函数参数不应使用 `undefined` 作为默认值

```ts
// ❌
function foo(bar: string = undefined) { }

// ✅
function foo(bar?: string) { }
```

### 5.2 函数返回值如果是数组/对象，考虑是否可能为空

```ts
// ❌ 调用方可能忘记处理 undefined
function findItem(): Item | null { ... }

// ✅ 明确标注
function findItem(): Item | null { ... }
```

---

## 6. Vue 3 特定规则

### 6.1 `<script setup>` 中的类型标注

```ts
// ✅ 使用 defineProps + 泛型
const props = defineProps<{ items: Item[] }>();

// ✅ 使用 ref 的泛型
const count = ref<number>(0);
const items = ref<Item[]>([]);
```

### 6.2 模板中的类型安全

```vue
<!-- ✅ 使用可选链处理可能为 undefined 的值 -->
<div v-if="item?.name">{{ item.name }}</div>

<!-- ❌ 直接访问可能为 undefined -->
<div v-if="item">{{ item.name }}</div>  <!-- item 本身可能 undefined -->
```

---

## 7. 枚举与字面量类型

### ✅ 使用字面量联合类型（项目惯例）

```ts
type BandType = 'title' | 'pageHeader' | 'columnHeader' | 'detail';
```

### ❌ 不使用 `enum`（项目不使用）

```ts
// 不要用这个
enum BandType {
  Title = 'title',
  // ...
}
```

---

## 8. 构建验证

修改任何 TypeScript 文件后，**必须**运行：

```bash
pnpm build
```

如果 `vue-tsc -b` 报错，修复后才能提交。不要假设"小改动不会出错"。

---

## 9. 速查表：常见 TS 错误及修复

| 错误码 | 原因 | 修复方式 |
|--------|------|----------|
| `TS2532` | Object is possibly 'undefined' | 添加空值守卫或 `!` |
| `TS2322` | 类型不可赋值 | 检查变量类型，添加类型断言或守卫 |
| `TS18048` | 变量 possibly 'undefined' | 同上 |
| `TS2769` | No overload matches this call | 检查参数类型，添加空值守卫 |
| `TS2304` | Cannot find name | 检查是否缺少 `import type` |
| `TS2345` | 参数类型不匹配 | 检查参数是否可能是 `undefined` |
