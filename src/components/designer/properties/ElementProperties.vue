<template>
    <div class="element-properties">
        <h3>{{ t("properties.title") }}</h3>

        <!-- 样式管理按钮 -->
        <div class="style-management-section">
            <n-button type="primary" @click="showStyleManagerModal = true">
                {{ t("properties.styleManagement") }}
            </n-button>
        </div>

        <!-- 报表属性 -->
        <div
            v-if="!selectedBandIndex && !selectedElement"
            class="property-section"
        >
            <h4>{{ t("properties.reportProperties") }}</h4>

            <!-- Band高度设置 -->
            <div class="form-group">
                <h4>{{ t("properties.bandHeightSettings") }}</h4>
                <div class="band-heights-grid">
                    <div
                        v-for="(band, index) in bands"
                        :key="index"
                        class="band-height-item"
                    >
                        <label>{{ getBandDisplayName(band.type) }}</label>
                        <div class="band-height-control">
                            <input
                                v-model.number="band.height"
                                type="number"
                                min="0"
                                step="1"
                                class="band-height-input"
                                @change="
                                    ensureIntegerValue(band, 'height');
                                    updateBandHeight(index);
                                "
                                @blur="
                                    ensureIntegerValue(band, 'height');
                                    updateBandHeight(index);
                                "
                            />
                            <span class="band-height-unit">px</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 元素属性 -->
        <div
            v-else-if="selectedElement && currentElement"
            class="property-section"
        >
            <!-- 元素属性标签页 -->
            <n-tabs type="segment">
                <!-- 基本属性标签页 -->
                <n-tab-pane name="basic" :tab="t('properties.basicProperties')">
                    <h4>{{ t("properties.basicProperties") }}</h4>
                    <div class="basic-properties-grid">
                        <div class="form-group">
                            <label>{{ t("properties.x") }}</label>
                            <input
                                v-if="currentElement"
                                v-model.number="currentElement.x"
                                type="number"
                                @change="
                                    ensureIntegerValue(currentElement, 'x')
                                "
                            />
                        </div>
                        <div class="form-group">
                            <label>{{ t("properties.y") }}</label>
                            <input
                                v-if="currentElement"
                                v-model.number="currentElement.y"
                                type="number"
                                @change="
                                    ensureIntegerValue(currentElement, 'y')
                                "
                            />
                        </div>
                        <div class="form-group">
                            <label>{{ t("properties.width") }}</label>
                            <input
                                v-if="currentElement"
                                v-model.number="currentElement.width"
                                type="number"
                                @change="
                                    ensureIntegerValue(currentElement, 'width')
                                "
                            />
                        </div>
                        <div class="form-group">
                            <label>{{ t("properties.height") }}</label>
                            <input
                                v-if="currentElement"
                                v-model.number="currentElement.height"
                                type="number"
                                @change="
                                    ensureIntegerValue(currentElement, 'height')
                                "
                            />
                        </div>
                    </div>

                    <!-- 通用条件打印表达式（所有元素类型，break和table除外） -->
                    <div
                        class="form-group"
                        v-if="
                            currentElement &&
                            currentElement.type !== 'break' &&
                            currentElement.type !== 'table'
                        "
                    >
                        <label>{{
                            t("properties.printWhenExpression") ||
                            "条件打印表达式"
                        }}</label>
                        <ExpressionEditor
                            :model-value="
                                currentElement.printWhenExpression || ''
                            "
                            @update:model-value="
                                currentElement.printWhenExpression = $event
                            "
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                        />
                    </div>

                    <!-- 样式引用 -->
                    <div
                        class="form-group"
                        v-if="reportStyles && reportStyles.length > 0"
                    >
                        <label>{{
                            t("properties.styleReference") || "样式引用"
                        }}</label>
                        <select
                            v-model="currentElement.style"
                            class="form-select"
                        >
                            <option value="">
                                {{ t("properties.noStyle") || "无样式" }}
                            </option>
                            <option
                                v-for="s in reportStyles"
                                :key="s.name"
                                :value="s.name"
                            >
                                {{ s.name }}
                            </option>
                        </select>
                    </div>

                    <!-- 根据元素类型显示特定属性 -->
                    <template v-if="currentElement.type === 'staticText'">
                        <div class="form-group">
                            <label>{{ t("properties.textContent") }}</label>
                            <textarea
                                v-if="currentElement"
                                v-model="currentElement.text"
                            ></textarea>
                        </div>
                        <div class="form-group">
                            <label>{{ t("properties.fontSize") }}</label>
                            <input
                                v-if="currentElement"
                                v-model.number="currentElement.fontSize"
                                type="number"
                            />
                        </div>
                        <div class="checkbox-group">
                            <label>
                                <input
                                    v-if="currentElement"
                                    v-model="currentElement.isBold"
                                    type="checkbox"
                                />
                                {{ t("properties.bold") }}
                            </label>
                            <label>
                                <input
                                    v-if="currentElement"
                                    v-model="currentElement.isItalic"
                                    type="checkbox"
                                />
                                {{ t("properties.italic") }}
                            </label>
                            <label>
                                <input
                                    v-if="currentElement"
                                    v-model="currentElement.isUnderline"
                                    type="checkbox"
                                />
                                {{ t("properties.underline") }}
                            </label>
                        </div>
                    </template>

                    <!-- Rectangle属性 -->
                    <template
                        v-if="
                            currentElement &&
                            currentElement.type === 'rectangle'
                        "
                    >
                        <div class="form-group">
                            <SwitchControl
                                :model-value="
                                    currentElement.isPrintRepeatedValues !==
                                    false
                                "
                                @update:model-value="
                                    currentElement.isPrintRepeatedValues =
                                        $event
                                "
                                label="打印重复值"
                            />
                        </div>
                    </template>

                    <!-- Ellipse属性 -->
                    <template
                        v-if="
                            currentElement && currentElement.type === 'ellipse'
                        "
                    >
                        <div class="form-group">
                            <SwitchControl
                                :model-value="
                                    currentElement.isPrintRepeatedValues !==
                                    false
                                "
                                @update:model-value="
                                    currentElement.isPrintRepeatedValues =
                                        $event
                                "
                                label="打印重复值"
                            />
                        </div>
                    </template>

                    <!-- Line属性 -->
                    <template
                        v-if="currentElement && currentElement.type === 'line'"
                    >
                        <div class="form-group">
                            <SwitchControl
                                :model-value="
                                    currentElement.isPrintRepeatedValues !==
                                    false
                                "
                                @update:model-value="
                                    currentElement.isPrintRepeatedValues =
                                        $event
                                "
                                label="打印重复值"
                            />
                        </div>
                    </template>

                    <!-- Break属性 -->
                    <template
                        v-if="currentElement && currentElement.type === 'break'"
                    >
                        <div class="form-group">
                            <SwitchControl
                                :model-value="
                                    currentElement.isResetPageNumber || false
                                "
                                @update:model-value="
                                    currentElement.isResetPageNumber = $event
                                "
                                label="重置页码"
                            />
                        </div>
                    </template>

                    <template
                        v-else-if="
                            currentElement &&
                            currentElement.type === 'textField'
                        "
                    >
                        <div
                            class="form-group"
                            v-if="
                                currentElement &&
                                currentElement.type === 'textField'
                            "
                        >
                            <label>{{ t("properties.expression") }}</label>
                            <ExpressionEditor
                                :model-value="getTextFieldExpression(currentElement)"
                                @update:model-value="updateTextFieldExpression"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                :placeholder="t('properties.expressionHint', { fieldHolder: '$F{fieldName}' })"
                            />
                        </div>
                        <div class="form-group">
                            <label>{{ t("properties.pattern") }}</label>
                            <input
                                v-if="currentElement"
                                v-model="currentElement.pattern"
                                type="text"
                            />
                            <small>{{ t("properties.patternHint") }}</small>
                        </div>

                        <!-- 新增：求值时间 -->
                        <div class="form-group">
                            <label>求值时间</label>
                            <select
                                v-if="currentElement"
                                v-model="currentElement.evaluationTime"
                            >
                                <option value="Now">Now - 立即求值</option>
                                <option value="Report">Report - 报表结束时</option>
                                <option value="Page">Page - 页面结束时</option>
                                <option value="Column">Column - 列结束时</option>
                                <option value="Group">Group - 组结束时</option>
                                <option value="Band">Band - 区域结束时</option>
                                <option value="Auto">Auto - 引擎决定</option>
                                <option value="Master">Master - 主报表结束时</option>
                            </select>
                        </div>

                        <!-- 新增：超链接类型 -->
                        <div class="form-group">
                            <label>超链接类型</label>
                            <select
                                v-if="currentElement"
                                v-model="currentElement.hyperlinkType"
                            >
                                <option value="None">无</option>
                                <option value="Reference">Reference</option>
                                <option value="Anchor">Anchor</option>
                            </select>
                        </div>

                        <!-- 新增：书签层级 -->
                        <div class="form-group">
                            <label>书签层级</label>
                            <input
                                v-if="currentElement"
                                v-model.number="currentElement.bookmarkLevel"
                                type="number"
                                min="0"
                            />
                        </div>

                        <!-- 新增：忽略分页 -->
                        <div class="form-group">
                            <SwitchControl
                                :model-value="
                                    currentElement.isIgnorePagination || false
                                "
                                @update:model-value="
                                    currentElement.isIgnorePagination = $event
                                "
                                label="忽略分页"
                            />
                        </div>
                    </template>
                </n-tab-pane>

                <!-- 表格属性标签页 -->
                <n-tab-pane
                    v-if="currentElement && currentElement.type === 'table'"
                    name="table"
                    :tab="t('properties.tableProperties')"
                >
                    <!-- 表格基本属性 -->
                    <TableProperties
                        :element="currentElement"
                        :available-styles="reportStyles.map((s) => s.name)"
                        :report-fields="reportFields"
                        :report-parameters="reportParameters"
                        :report-variables="reportVariables"
                        @update:element="handleTablePropertyUpdate"
                    />

                    <!-- 分隔线 -->
                    <div class="prop-divider"></div>

                    <!-- 列管理 -->
                    <div class="form-group">
                        <h5>列管理</h5>
                        <div class="column-tree-toolbar">
                            <button
                                class="prop-btn-primary"
                                @click="handleAddRootColumn"
                                title="添加列"
                            >
                                + 列
                            </button>
                            <button
                                class="prop-btn-primary"
                                @click="handleAddRootGroup"
                                title="添加分组"
                            >
                                + 分组
                            </button>
                            <button
                                class="prop-btn-default"
                                @click="addColumnGroup"
                                title="选择列组合"
                            >
                                组合列
                            </button>
                        </div>

                        <!-- 列树 -->
                        <div class="column-tree">
                            <ColumnTreeNode
                                v-for="(child, index) in tableChildren"
                                :key="child.uuid || index"
                                :node="child"
                                :depth="0"
                                :is-last="index === tableChildren.length - 1"
                                :parent-uuid="null"
                                :parent-length="tableChildren.length"
                                :sibling-index="index"
                                @update-node="handleColumnNodeUpdate"
                                @delete-node="handleColumnNodeDelete"
                                @add-column-after="handleAddColumnAfter"
                                @add-column-child="handleAddColumnChild"
                                @add-column-group-after="
                                    handleAddColumnGroupAfter
                                "
                                @ungroup-node="handleUngroupNode"
                                @move-node="handleMoveNode"
                            />
                            <div
                                v-if="tableChildren.length === 0"
                                class="column-tree-empty-hint"
                            >
                                点击上方按钮添加列
                            </div>
                        </div>
                    </div>

                    <!-- 行高设置 -->
                    <div
                        class="form-group"
                        v-if="currentElement && currentElement.type === 'table'"
                    >
                        <h5>行高设置</h5>
                        <div class="prop-table-column-props">
                            <div class="form-group">
                                <label>表头行高</label>
                                <input
                                    v-model.number="tableRowHeights.tableHeader"
                                    type="number"
                                    min="1"
                                    @change="updateAllColumnRowHeights"
                                />
                            </div>
                            <div class="form-group">
                                <label>列头行高</label>
                                <input
                                    v-model.number="
                                        tableRowHeights.columnHeader
                                    "
                                    type="number"
                                    min="1"
                                    @change="updateAllColumnRowHeights"
                                />
                            </div>
                            <div class="form-group">
                                <label>数据行高</label>
                                <input
                                    v-model.number="tableRowHeights.detailCell"
                                    type="number"
                                    min="1"
                                    @change="updateAllColumnRowHeights"
                                />
                            </div>
                            <div class="form-group">
                                <label>列尾行高</label>
                                <input
                                    v-model.number="
                                        tableRowHeights.columnFooter
                                    "
                                    type="number"
                                    min="1"
                                    @change="updateAllColumnRowHeights"
                                />
                            </div>
                            <div class="form-group">
                                <label>表尾行高</label>
                                <input
                                    v-model.number="tableRowHeights.tableFooter"
                                    type="number"
                                    min="1"
                                    @change="updateAllColumnRowHeights"
                                />
                            </div>
                        </div>
                    </div>
                </n-tab-pane>
                <n-tab-pane
                    v-if="currentElement && currentElement.type === 'frame'"
                    name="frame"
                    :tab="'Frame属性'"
                >
                    <FrameProperties
                        :element="currentElement"
                        :report-fields="reportFields"
                        :report-parameters="reportParameters"
                        :report-variables="reportVariables"
                        @update:element="handleFramePropertyUpdate"
                    />
                </n-tab-pane>

                <!-- 样式设置标签页 -->
                <n-tab-pane name="style" :tab="t('properties.styleSettings')">
                    <template
                        v-if="currentElement && currentElement.type === 'break'"
                    >
                        <div class="box-section">
                            <p style="font-size: 12px; color: #666">
                                {{ t("properties.breakNoStyle") }}
                            </p>
                        </div>
                    </template>
                    <template v-else>
                        <h4>{{ t("properties.styleSettings") }}</h4>

                        <!-- 边框设置 (表格元素不支持) -->
                        <template v-if="currentElement.type !== 'table'">
                            <!-- 矩形/椭圆元素的边框设置 (统一设置) -->
                            <template
                                v-if="
                                    currentElement &&
                                    (currentElement.type === 'rectangle' ||
                                        currentElement.type === 'ellipse')
                                "
                            >
                                <div class="box-section compact">
                                    <h5>{{ t("properties.unifiedBorder") }}</h5>
                                    <p
                                        style="
                                            font-size: 12px;
                                            color: #666;
                                            margin-bottom: 8px;
                                        "
                                    >
                                        {{ t("properties.unifiedBorderHint") }}
                                    </p>

                                    <div class="border-group-row">
                                        <div class="border-group-item">
                                            <label class="side-label">{{
                                                t("properties.style")
                                            }}</label>
                                            <n-radio-group
                                                v-model:value="
                                                    rectangleBorderStyle
                                                "
                                                @update:value="
                                                    setRectangleBorderStyle(
                                                        rectangleBorderStyle,
                                                    )
                                                "
                                                size="small"
                                            >
                                                <n-radio-button value="">{{
                                                    t("properties.none")
                                                }}</n-radio-button>
                                                <n-radio-button value="Solid">{{
                                                    t("properties.solid")
                                                }}</n-radio-button>
                                                <n-radio-button
                                                    value="Dashed"
                                                    >{{
                                                        t("properties.dashed")
                                                    }}</n-radio-button
                                                >
                                                <n-radio-button
                                                    value="Dotted"
                                                    >{{
                                                        t("properties.dotted")
                                                    }}</n-radio-button
                                                >
                                                <n-radio-button
                                                    value="Double"
                                                    >{{
                                                        t("properties.double")
                                                    }}</n-radio-button
                                                >
                                            </n-radio-group>
                                        </div>

                                        <div class="border-group-item">
                                            <label class="side-label">{{
                                                t("properties.width")
                                            }}</label>
                                            <input
                                                :value="
                                                    getRectangleBorderWidth()
                                                "
                                                @input="
                                                    setRectangleBorderWidth(
                                                        (
                                                            $event.target as HTMLInputElement
                                                        ).value,
                                                    )
                                                "
                                                type="number"
                                                min="0"
                                                max="10"
                                                step="0.5"
                                                class="width-control compact"
                                                :placeholder="
                                                    t('properties.width')
                                                "
                                            />
                                        </div>

                                        <div class="border-group-item">
                                            <label class="side-label">{{
                                                t("properties.color")
                                            }}</label>
                                            <input
                                                :value="
                                                    getRectangleBorderColor()
                                                "
                                                @input="
                                                    setRectangleBorderColor(
                                                        (
                                                            $event.target as HTMLInputElement
                                                        ).value,
                                                    )
                                                "
                                                type="color"
                                                class="color-control compact"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </template>

                            <!-- 其他元素的边框设置 (支持各边独立设置) -->
                            <template v-else>
                                <!-- 各边边框设置 -->
                                <div class="box-section compact">
                                    <h5>{{ t("properties.sideBorders") }}</h5>

                                    <div class="border-sides-grid">
                                        <!-- 四边统一设置 -->
                                        <div class="border-side-item">
                                            <label class="side-label">{{
                                                t("properties.all")
                                            }}</label>
                                            <div class="border-side-controls">
                                                <n-radio-group
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getUnifiedBorderStyle()
                                                    "
                                                    @update:value="
                                                        setUnifiedBorderStyle(
                                                            $event,
                                                        )
                                                    "
                                                    size="small"
                                                >
                                                    <n-radio-button value="">{{
                                                        t("properties.none")
                                                    }}</n-radio-button>
                                                    <n-radio-button
                                                        value="Solid"
                                                        >{{
                                                            t(
                                                                "properties.solid",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Dashed"
                                                        >{{
                                                            t(
                                                                "properties.dashed",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Dotted"
                                                        >{{
                                                            t(
                                                                "properties.dotted",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Double"
                                                        >{{
                                                            t(
                                                                "properties.double",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                </n-radio-group>
                                                <input
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getUnifiedBorderWidth()
                                                    "
                                                    @input="
                                                        setUnifiedBorderWidth(
                                                            (
                                                                $event.target as HTMLInputElement
                                                            ).value,
                                                        )
                                                    "
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="0.5"
                                                    class="width-control compact"
                                                    :placeholder="
                                                        t('properties.width')
                                                    "
                                                />
                                                <input
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getUnifiedBorderColor()
                                                    "
                                                    @input="
                                                        setUnifiedBorderColor(
                                                            (
                                                                $event.target as HTMLInputElement
                                                            ).value,
                                                        )
                                                    "
                                                    type="color"
                                                    class="color-control compact"
                                                />
                                            </div>
                                        </div>

                                        <!-- 上边 -->
                                        <div class="border-side-item">
                                            <label class="side-label">{{
                                                t("properties.topSide")
                                            }}</label>
                                            <div class="border-side-controls">
                                                <n-radio-group
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderStyle(
                                                            'top',
                                                        )
                                                    "
                                                    @update:value="
                                                        setSideBorderStyle(
                                                            'top',
                                                            $event,
                                                        )
                                                    "
                                                    size="small"
                                                >
                                                    <n-radio-button value="">{{
                                                        t("properties.none")
                                                    }}</n-radio-button>
                                                    <n-radio-button
                                                        value="Solid"
                                                        >{{
                                                            t(
                                                                "properties.solid",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Dashed"
                                                        >{{
                                                            t(
                                                                "properties.dashed",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Dotted"
                                                        >{{
                                                            t(
                                                                "properties.dotted",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Double"
                                                        >{{
                                                            t(
                                                                "properties.double",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                </n-radio-group>
                                                <input
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderWidth(
                                                            'top',
                                                        )
                                                    "
                                                    @input="
                                                        setSideBorderWidth(
                                                            'top',
                                                            (
                                                                $event.target as HTMLInputElement
                                                            ).value,
                                                        )
                                                    "
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="0.5"
                                                    class="width-control compact"
                                                    :placeholder="
                                                        t('properties.width')
                                                    "
                                                />
                                                <input
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderColor(
                                                            'top',
                                                        )
                                                    "
                                                    @input="
                                                        setSideBorderColor(
                                                            'top',
                                                            (
                                                                $event.target as HTMLInputElement
                                                            ).value,
                                                        )
                                                    "
                                                    type="color"
                                                    class="color-control compact"
                                                />
                                            </div>
                                        </div>

                                        <!-- 左边 -->
                                        <div class="border-side-item">
                                            <label class="side-label">{{
                                                t("properties.leftSide")
                                            }}</label>
                                            <div class="border-side-controls">
                                                <n-radio-group
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderStyle(
                                                            'left',
                                                        )
                                                    "
                                                    @update:value="
                                                        setSideBorderStyle(
                                                            'left',
                                                            $event,
                                                        )
                                                    "
                                                    size="small"
                                                >
                                                    <n-radio-button value="">{{
                                                        t("properties.none")
                                                    }}</n-radio-button>
                                                    <n-radio-button
                                                        value="Solid"
                                                        >{{
                                                            t(
                                                                "properties.solid",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Dashed"
                                                        >{{
                                                            t(
                                                                "properties.dashed",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Dotted"
                                                        >{{
                                                            t(
                                                                "properties.dotted",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Double"
                                                        >{{
                                                            t(
                                                                "properties.double",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                </n-radio-group>
                                                <input
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderWidth(
                                                            'left',
                                                        )
                                                    "
                                                    @input="
                                                        setSideBorderWidth(
                                                            'left',
                                                            (
                                                                $event.target as HTMLInputElement
                                                            ).value,
                                                        )
                                                    "
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="0.5"
                                                    class="width-control compact"
                                                    :placeholder="
                                                        t('properties.width')
                                                    "
                                                />
                                                <input
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderColor(
                                                            'left',
                                                        )
                                                    "
                                                    @input="
                                                        setSideBorderColor(
                                                            'left',
                                                            (
                                                                $event.target as HTMLInputElement
                                                            ).value,
                                                        )
                                                    "
                                                    type="color"
                                                    class="color-control compact"
                                                />
                                            </div>
                                        </div>

                                        <!-- 下边 -->
                                        <div class="border-side-item">
                                            <label class="side-label">{{
                                                t("properties.bottomSide")
                                            }}</label>
                                            <div class="border-side-controls">
                                                <n-radio-group
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderStyle(
                                                            'bottom',
                                                        )
                                                    "
                                                    @update:value="
                                                        setSideBorderStyle(
                                                            'bottom',
                                                            $event,
                                                        )
                                                    "
                                                    size="small"
                                                >
                                                    <n-radio-button value="">{{
                                                        t("properties.none")
                                                    }}</n-radio-button>
                                                    <n-radio-button
                                                        value="Solid"
                                                        >{{
                                                            t(
                                                                "properties.solid",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Dashed"
                                                        >{{
                                                            t(
                                                                "properties.dashed",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Dotted"
                                                        >{{
                                                            t(
                                                                "properties.dotted",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Double"
                                                        >{{
                                                            t(
                                                                "properties.double",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                </n-radio-group>
                                                <input
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderWidth(
                                                            'bottom',
                                                        )
                                                    "
                                                    @input="
                                                        setSideBorderWidth(
                                                            'bottom',
                                                            (
                                                                $event.target as HTMLInputElement
                                                            ).value,
                                                        )
                                                    "
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="0.5"
                                                    class="width-control compact"
                                                    :placeholder="
                                                        t('properties.width')
                                                    "
                                                />
                                                <input
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderColor(
                                                            'bottom',
                                                        )
                                                    "
                                                    @input="
                                                        setSideBorderColor(
                                                            'bottom',
                                                            (
                                                                $event.target as HTMLInputElement
                                                            ).value,
                                                        )
                                                    "
                                                    type="color"
                                                    class="color-control compact"
                                                />
                                            </div>
                                        </div>

                                        <!-- 右边 -->
                                        <div class="border-side-item">
                                            <label class="side-label">{{
                                                t("properties.rightSide")
                                            }}</label>
                                            <div class="border-side-controls">
                                                <n-radio-group
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderStyle(
                                                            'right',
                                                        )
                                                    "
                                                    @update:value="
                                                        setSideBorderStyle(
                                                            'right',
                                                            $event,
                                                        )
                                                    "
                                                    size="small"
                                                >
                                                    <n-radio-button value="">{{
                                                        t("properties.none")
                                                    }}</n-radio-button>
                                                    <n-radio-button
                                                        value="Solid"
                                                        >{{
                                                            t(
                                                                "properties.solid",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Dashed"
                                                        >{{
                                                            t(
                                                                "properties.dashed",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Dotted"
                                                        >{{
                                                            t(
                                                                "properties.dotted",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                    <n-radio-button
                                                        value="Double"
                                                        >{{
                                                            t(
                                                                "properties.double",
                                                            )
                                                        }}</n-radio-button
                                                    >
                                                </n-radio-group>
                                                <input
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderWidth(
                                                            'right',
                                                        )
                                                    "
                                                    @input="
                                                        setSideBorderWidth(
                                                            'right',
                                                            (
                                                                $event.target as HTMLInputElement
                                                            ).value,
                                                        )
                                                    "
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="0.5"
                                                    class="width-control compact"
                                                    :placeholder="
                                                        t('properties.width')
                                                    "
                                                />
                                                <input
                                                    v-if="
                                                        currentElement &&
                                                        currentElement.box
                                                    "
                                                    :value="
                                                        getSideBorderColor(
                                                            'right',
                                                        )
                                                    "
                                                    @input="
                                                        setSideBorderColor(
                                                            'right',
                                                            (
                                                                $event.target as HTMLInputElement
                                                            ).value,
                                                        )
                                                    "
                                                    type="color"
                                                    class="color-control compact"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 边距设置 -->
                                <div class="box-section compact">
                                    <h5>
                                        {{ t("properties.marginSettings") }}
                                    </h5>
                                    <div class="form-group compact">
                                        <label>{{
                                            t("properties.globalMargin")
                                        }}</label>
                                        <input
                                            v-if="
                                                currentElement &&
                                                currentElement.box
                                            "
                                            v-model.number="
                                                currentElement.box.padding
                                            "
                                            type="number"
                                            :placeholder="
                                                t('properties.globalMargin')
                                            "
                                            class="small-input"
                                        />
                                        <small>{{
                                            t("properties.globalMarginHint")
                                        }}</small>
                                    </div>

                                    <div class="padding-grid compact">
                                        <div class="form-group compact">
                                            <label>{{
                                                t("properties.topMargin")
                                            }}</label>
                                            <input
                                                v-if="
                                                    currentElement &&
                                                    currentElement.box
                                                "
                                                v-model.number="
                                                    currentElement.box
                                                        .topPadding
                                                "
                                                type="number"
                                                class="small-input"
                                            />
                                        </div>
                                        <div class="form-group compact">
                                            <label>{{
                                                t("properties.leftMargin")
                                            }}</label>
                                            <input
                                                v-if="
                                                    currentElement &&
                                                    currentElement.box
                                                "
                                                v-model.number="
                                                    currentElement.box
                                                        .leftPadding
                                                "
                                                type="number"
                                                class="small-input"
                                            />
                                        </div>
                                        <div class="form-group compact">
                                            <label>{{
                                                t("properties.bottomMargin")
                                            }}</label>
                                            <input
                                                v-if="
                                                    currentElement &&
                                                    currentElement.box
                                                "
                                                v-model.number="
                                                    currentElement.box
                                                        .bottomPadding
                                                "
                                                type="number"
                                                class="small-input"
                                            />
                                        </div>
                                        <div class="form-group compact">
                                            <label>{{
                                                t("properties.rightMargin")
                                            }}</label>
                                            <input
                                                v-if="
                                                    currentElement &&
                                                    currentElement.box
                                                "
                                                v-model.number="
                                                    currentElement.box
                                                        .rightPadding
                                                "
                                                type="number"
                                                class="small-input"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </template>
                        <div class="form-group-row">
                            <div class="form-group half-width">
                                <label>{{ t("properties.forecolor") }}</label>
                                <ColorPickerWithOpacity
                                    v-model="currentElement.forecolor"
                                    v-model:mode="currentElement.forecolorMode"
                                    @update:modelValue="emit('update-jrxml')"
                                    @update:mode="emit('update-jrxml')"
                                />
                            </div>

                            <div class="form-group half-width">
                                <label>{{
                                    t("properties.backgroundColor")
                                }}</label>
                                <ColorPickerWithOpacity
                                    v-model="currentElement.backcolor"
                                    v-model:mode="currentElement.mode"
                                    @update:modelValue="emit('update-jrxml')"
                                    @update:mode="emit('update-jrxml')"
                                />
                            </div>
                        </div>

                        <div class="form-group">
                            <label>{{ t("properties.backgroundMode") }}</label>
                            <select
                                v-if="currentElement"
                                v-model="currentElement.mode"
                                @change="emit('update-jrxml')"
                            >
                                <option :value="undefined">
                                    {{ t("properties.defaultTransparent") }}
                                </option>
                                <option value="Transparent">
                                    {{ t("properties.transparent") }}
                                </option>
                                <option value="Opaque">
                                    {{ t("properties.opaque") }}
                                </option>
                            </select>
                        </div>

                        <!-- 表格特定样式设置 -->
                        <template
                            v-if="
                                currentElement &&
                                currentElement.type === 'table'
                            "
                        >
                            <div class="form-group">
                                <h5>
                                    {{ t("properties.tableStyleSettings") }}
                                </h5>
                                <div class="table-style-settings">
                                    <!-- 表头样式选择 -->
                                    <div class="table-style-section">
                                        <h6>
                                            {{ t("properties.tableHeader") }}
                                            {{ t("properties.style") }}
                                        </h6>
                                        <div class="box-section compact">
                                            <div class="form-group">
                                                <label>{{
                                                    t("properties.selectStyle")
                                                }}</label>
                                                <select
                                                    v-model="
                                                        tableStyles.tableHeader
                                                    "
                                                    @change="
                                                        updateTableStyles();
                                                        emit('update-jrxml');
                                                    "
                                                >
                                                    <option value="Table_TH">
                                                        Table_TH
                                                    </option>
                                                    <option value="Table_CH">
                                                        Table_CH
                                                    </option>
                                                    <option value="Table_TD">
                                                        Table_TD
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 列头样式选择 -->
                                    <div class="table-style-section">
                                        <h6>
                                            {{ t("properties.columnHeader") }}
                                            {{ t("properties.style") }}
                                        </h6>
                                        <div class="box-section compact">
                                            <div class="form-group">
                                                <label>{{
                                                    t("properties.selectStyle")
                                                }}</label>
                                                <select
                                                    v-model="
                                                        tableStyles.columnHeader
                                                    "
                                                    @change="
                                                        updateTableStyles();
                                                        emit('update-jrxml');
                                                    "
                                                >
                                                    <option value="Table_TH">
                                                        Table_TH
                                                    </option>
                                                    <option value="Table_CH">
                                                        Table_CH
                                                    </option>
                                                    <option value="Table_TD">
                                                        Table_TD
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 列尾样式选择 -->
                                    <div class="table-style-section">
                                        <h6>
                                            {{ t("properties.columnFooter") }}
                                            {{ t("properties.style") }}
                                        </h6>
                                        <div class="box-section compact">
                                            <div class="form-group">
                                                <label>{{
                                                    t("properties.selectStyle")
                                                }}</label>
                                                <select
                                                    v-model="
                                                        tableStyles.columnFooter
                                                    "
                                                    @change="
                                                        updateTableStyles();
                                                        emit('update-jrxml');
                                                    "
                                                >
                                                    <option value="Table_TH">
                                                        Table_TH
                                                    </option>
                                                    <option value="Table_CH">
                                                        Table_CH
                                                    </option>
                                                    <option value="Table_TD">
                                                        Table_TD
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 详情单元格样式选择 -->
                                    <div class="table-style-section">
                                        <h6>
                                            {{ t("properties.detailCell") }}
                                            {{ t("properties.style") }}
                                        </h6>
                                        <div class="box-section compact">
                                            <div class="form-group">
                                                <label>{{
                                                    t("properties.selectStyle")
                                                }}</label>
                                                <select
                                                    v-model="
                                                        tableStyles.detailCell
                                                    "
                                                    @change="
                                                        updateTableStyles();
                                                        emit('update-jrxml');
                                                    "
                                                >
                                                    <option value="Table_TH">
                                                        Table_TH
                                                    </option>
                                                    <option value="Table_CH">
                                                        Table_CH
                                                    </option>
                                                    <option value="Table_TD">
                                                        Table_TD
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <!-- 其他元素的样式设置 -->
                        <template
                            v-else-if="
                                currentElement &&
                                currentElement.type !== 'line' &&
                                currentElement.type !== 'image' &&
                                currentElement.type !== 'frame'
                            "
                        >
                            <div class="form-group">
                                <label>{{ t("properties.fontName") }}</label>
                                <select
                                    v-if="currentElement"
                                    v-model="currentElement.fontFamily"
                                    style="
                                        appearance: none;
                                        -webkit-appearance: none;
                                    "
                                >
                                    <option value="">
                                        {{ t("properties.useDefaultFont") }}
                                    </option>
                                    <option
                                        v-for="font in availableFonts"
                                        :key="font"
                                        :value="font"
                                    >
                                        {{ font }}
                                    </option>
                                </select>
                                <small class="font-hint">{{
                                    t("properties.fontHint")
                                }}</small>
                            </div>

                            <div class="form-group-row">
                                <div class="form-group half-width">
                                    <label>{{
                                        t("properties.textAlignment")
                                    }}</label>
                                    <div class="alignment-controls compact">
                                        <n-button
                                            v-for="align in [
                                                'Left',
                                                'Center',
                                                'Right',
                                            ]"
                                            :key="align"
                                            @click="
                                                setHorizontalAlignment(
                                                    align as
                                                        | 'Left'
                                                        | 'Center'
                                                        | 'Right',
                                                )
                                            "
                                            :type="
                                                currentElement &&
                                                currentElement.textAlignment ===
                                                    align
                                                    ? 'primary'
                                                    : 'default'
                                            "
                                            :title="
                                                t(
                                                    `properties.${align.toLowerCase()}`,
                                                )
                                            "
                                            size="small"
                                        >
                                            {{
                                                t(
                                                    `properties.${align.toLowerCase()}`,
                                                )
                                            }}
                                        </n-button>
                                    </div>
                                </div>

                                <div class="form-group half-width">
                                    <label>{{
                                        t("properties.verticalAlignment")
                                    }}</label>
                                    <div class="alignment-controls compact">
                                        <n-button
                                            v-for="align in [
                                                'Top',
                                                'Middle',
                                                'Bottom',
                                            ]"
                                            :key="align"
                                            @click="
                                                setVerticalAlignment(
                                                    align as
                                                        | 'Top'
                                                        | 'Middle'
                                                        | 'Bottom',
                                                )
                                            "
                                            :type="
                                                currentElement &&
                                                currentElement.verticalAlignment ===
                                                    align
                                                    ? 'primary'
                                                    : 'default'
                                            "
                                            :title="
                                                t(
                                                    `properties.${align.toLowerCase()}`,
                                                )
                                            "
                                            size="small"
                                        >
                                            {{
                                                t(
                                                    `properties.${align.toLowerCase()}`,
                                                )
                                            }}
                                        </n-button>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group" style="margin-bottom: 8px">
                                <label>{{ t("properties.fontStyle") }}</label>
                                <div class="checkbox-group compact">
                                    <label>
                                        <input
                                            v-if="currentElement"
                                            v-model="currentElement.isBold"
                                            type="checkbox"
                                        />
                                        {{ t("properties.bold") }}
                                    </label>
                                    <label>
                                        <input
                                            v-if="currentElement"
                                            v-model="currentElement.isItalic"
                                            type="checkbox"
                                        />
                                        {{ t("properties.italic") }}
                                    </label>
                                    <label>
                                        <input
                                            v-if="currentElement"
                                            v-model="currentElement.isUnderline"
                                            type="checkbox"
                                        />
                                        {{ t("properties.underline") }}
                                    </label>
                                </div>
                            </div>
                        </template>
                    </template>
                </n-tab-pane>

                <!-- 子报表属性标签页 -->
                <n-tab-pane
                    v-if="currentElement && currentElement.type === 'subreport'"
                    name="subreport"
                    :tab="'子报表属性'"
                >
                    <div class="form-group">
                        <label>子报表表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.subreportExpression || ''"
                            @update:model-value="currentElement.subreportExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                            placeholder="例如: $P{SUBREPORT_DIR} + 'subreport.jasper'"
                        />
                    </div>
                    <div class="form-group">
                        <label>连接表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.connectionExpression || ''"
                            @update:model-value="currentElement.connectionExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                            placeholder="例如: $P{REPORT_CONNECTION}"
                        />
                    </div>
                    <div class="form-group">
                        <label>数据源表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.dataSourceExpression || ''"
                            @update:model-value="currentElement.dataSourceExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                            placeholder="例如: $P{REPORT_DATA_SOURCE}"
                        />
                    </div>
                    <div class="form-group">
                        <label>参数映射表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.parametersMapExpression || ''"
                            @update:model-value="currentElement.parametersMapExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                            placeholder="例如: $P{REPORT_PARAMETERS_MAP}"
                        />
                    </div>
                    <div class="form-group">
                        <label>求值时间</label>
                        <select v-model="currentElement.evaluationTime">
                            <option value="Now">Now - 立即求值</option>
                            <option value="Report">Report - 报表结束时</option>
                            <option value="Page">Page - 页面结束时</option>
                            <option value="Column">Column - 列结束时</option>
                            <option value="Group">Group - 组结束时</option>
                            <option value="Band">Band - 区域结束时</option>
                            <option value="Auto">Auto - 引擎决定</option>
                            <option value="Master">Master - 主报表结束时</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <SwitchControl
                            :model-value="currentElement.isUsingCache || false"
                            @update:model-value="currentElement.isUsingCache = $event"
                            label="使用缓存"
                        />
                    </div>
                    <div class="form-group">
                        <SwitchControl
                            :model-value="currentElement.isIgnorePagination || false"
                            @update:model-value="currentElement.isIgnorePagination = $event"
                            label="忽略分页"
                        />
                    </div>
                </n-tab-pane>

                <!-- 图表属性标签页 -->
                <n-tab-pane
                    v-if="currentElement && currentElement.type === 'chart'"
                    name="chart"
                    :tab="'图表属性'"
                >
                    <div class="form-group">
                        <label>图表类型</label>
                        <select v-model="currentElement.chartType">
                            <optgroup label="分类图表">
                                <option value="pie">饼图</option>
                                <option value="pie3D">3D饼图</option>
                                <option value="bar">柱状图</option>
                                <option value="bar3D">3D柱状图</option>
                                <option value="stackedBar">堆叠柱状图</option>
                                <option value="stackedBar3D">3D堆叠柱状图</option>
                                <option value="line">折线图</option>
                                <option value="area">面积图</option>
                                <option value="stackedArea">堆叠面积图</option>
                            </optgroup>
                            <optgroup label="XY图表">
                                <option value="xyBar">XY柱状图</option>
                                <option value="xyLine">XY折线图</option>
                                <option value="xyArea">XY面积图</option>
                                <option value="scatter">散点图</option>
                                <option value="bubble">气泡图</option>
                                <option value="timeSeries">时间序列</option>
                            </optgroup>
                            <optgroup label="金融图表">
                                <option value="highLow">高低图</option>
                                <option value="candlestick">K线图</option>
                            </optgroup>
                            <optgroup label="特殊图表">
                                <option value="meter">仪表盘</option>
                                <option value="thermometer">温度计</option>
                                <option value="multiAxis">多轴图</option>
                                <option value="gantt">甘特图</option>
                                <option value="spider">蛛网图</option>
                            </optgroup>
                        </select>
                    </div>

                    <!-- 图表设置 -->
                    <div class="form-group">
                        <label>渲染类型</label>
                        <select v-model="currentElement.renderType">
                            <option value="">默认</option>
                            <option value="svg">SVG</option>
                            <option value="draw">Draw</option>
                            <option value="image">Image</option>
                        </select>
                    </div>
                    <div class="form-group" style="display: flex; gap: 16px;">
                        <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                            <input type="checkbox" v-model="currentElement.isShowTitle" />
                            显示标题
                        </label>
                        <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                            <input type="checkbox" v-model="currentElement.isShowSubtitle" />
                            显示副标题
                        </label>
                        <label style="display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                            <input type="checkbox" v-model="currentElement.isShowLegend" />
                            显示图例
                        </label>
                    </div>
                    <div class="form-group">
                        <label>自定义类</label>
                        <input v-model="currentElement.customizerClass" type="text" placeholder="com.example.MyChartCustomizer" />
                    </div>

                    <!-- 标题表达式 -->
                    <div class="form-group">
                        <label>标题表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.titleExpression || ''"
                            @update:model-value="currentElement.titleExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                        />
                    </div>
                    <div class="form-group">
                        <label>标题文本</label>
                        <input v-model="currentElement.title" type="text" />
                    </div>
                    <div class="form-group">
                        <label>副标题表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.subtitleExpression || ''"
                            @update:model-value="currentElement.subtitleExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                        />
                    </div>
                    <div class="form-group">
                        <label>图例表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.legendExpression || ''"
                            @update:model-value="currentElement.legendExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                        />
                    </div>

                    <!-- 数据集设置 -->
                    <div style="border-top: 1px solid #e8e8e8; margin: 8px 0; padding-top: 8px;">
                        <label style="font-weight: 600; font-size: 12px; color: #666; margin-bottom: 6px; display: block;">数据集</label>
                    </div>
                    <div class="form-group">
                        <label>子数据集名称</label>
                        <input v-model="currentElement.subDataset" type="text" placeholder="例如: pieDataset" />
                    </div>
                    <div class="form-group">
                        <label>数据源表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.dataSourceExpression || ''"
                            @update:model-value="currentElement.dataSourceExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                            placeholder="例如: $P{myDatasource}"
                        />
                    </div>
                    <div class="form-group">
                        <label>增量类型</label>
                        <select v-model="currentElement.incrementType">
                            <option value="">无</option>
                            <option value="None">None</option>
                            <option value="Group">Group</option>
                            <option value="Page">Page</option>
                            <option value="Column">Column</option>
                            <option value="Report">Report</option>
                        </select>
                    </div>
                    <div class="form-group" v-if="currentElement.incrementType === 'Group'">
                        <label>增量分组</label>
                        <input v-model="currentElement.incrementGroup" type="text" />
                    </div>

                    <!-- 系列表达式（分类图表） -->
                    <template v-if="['bar','bar3D','stackedBar','stackedBar3D','line','area','stackedArea'].includes(currentElement.chartType)">
                        <div style="border-top: 1px solid #e8e8e8; margin: 8px 0; padding-top: 8px;">
                            <label style="font-weight: 600; font-size: 12px; color: #666; margin-bottom: 6px; display: block;">系列表达式</label>
                        </div>
                        <div class="form-group">
                            <label>系列</label>
                            <ExpressionEditor
                                :model-value="currentElement.seriesExpression || ''"
                                @update:model-value="currentElement.seriesExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: $F{sales_state}"
                            />
                        </div>
                        <div class="form-group">
                            <label>分类</label>
                            <ExpressionEditor
                                :model-value="currentElement.categoryExpression || ''"
                                @update:model-value="currentElement.categoryExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: $F{full_name}"
                            />
                        </div>
                        <div class="form-group">
                            <label>值</label>
                            <ExpressionEditor
                                :model-value="currentElement.valueExpression || ''"
                                @update:model-value="currentElement.valueExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: $V{amount}"
                            />
                        </div>
                    </template>

                    <!-- 饼图表达式 -->
                    <template v-if="['pie','pie3D'].includes(currentElement.chartType)">
                        <div style="border-top: 1px solid #e8e8e8; margin: 8px 0; padding-top: 8px;">
                            <label style="font-weight: 600; font-size: 12px; color: #666; margin-bottom: 6px; display: block;">饼图表达式</label>
                        </div>
                        <div class="form-group">
                            <label>键（Key）</label>
                            <ExpressionEditor
                                :model-value="currentElement.keyExpression || ''"
                                @update:model-value="currentElement.keyExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: $F{category}"
                            />
                        </div>
                        <div class="form-group">
                            <label>值（Value）</label>
                            <ExpressionEditor
                                :model-value="currentElement.valueExpression || ''"
                                @update:model-value="currentElement.valueExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: $V{amount}"
                            />
                        </div>
                    </template>

                    <!-- XY图表表达式 -->
                    <template v-if="['scatter','bubble','xyLine','xyArea','xyBar','timeSeries','highLow','candlestick'].includes(currentElement.chartType)">
                        <div style="border-top: 1px solid #e8e8e8; margin: 8px 0; padding-top: 8px;">
                            <label style="font-weight: 600; font-size: 12px; color: #666; margin-bottom: 6px; display: block;">XY系列表达式</label>
                        </div>
                        <div class="form-group">
                            <label>系列</label>
                            <ExpressionEditor
                                :model-value="currentElement.seriesExpression || ''"
                                @update:model-value="currentElement.seriesExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: $F{series}"
                            />
                        </div>
                        <div class="form-group">
                            <label>X值</label>
                            <ExpressionEditor
                                :model-value="currentElement.xValueExpression || ''"
                                @update:model-value="currentElement.xValueExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: $F{x_value}"
                            />
                        </div>
                        <div class="form-group">
                            <label>Y值</label>
                            <ExpressionEditor
                                :model-value="currentElement.yValueExpression || ''"
                                @update:model-value="currentElement.yValueExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: $F{y_value}"
                            />
                        </div>
                    </template>

                    <!-- 仪表盘/温度计表达式 -->
                    <template v-if="['meter','thermometer'].includes(currentElement.chartType)">
                        <div style="border-top: 1px solid #e8e8e8; margin: 8px 0; padding-top: 8px;">
                            <label style="font-weight: 600; font-size: 12px; color: #666; margin-bottom: 6px; display: block;">仪表盘设置</label>
                        </div>
                        <div class="form-group">
                            <label>数据表达式</label>
                            <ExpressionEditor
                                :model-value="currentElement.dataExpression || ''"
                                @update:model-value="currentElement.dataExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: $V{value}"
                            />
                        </div>
                        <div class="form-group" v-if="currentElement.chartType === 'meter'">
                            <label>形状</label>
                            <select v-model="currentElement.shape">
                                <option value="">默认</option>
                                <option value="chord">Chord</option>
                                <option value="pie">Pie</option>
                                <option value="circle">Circle</option>
                                <option value="fan">Fan</option>
                                <option value="dash">Dash</option>
                                <option value="bullet">Bullet</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>单位</label>
                            <input v-model="currentElement.units" type="text" placeholder="例如: %" />
                        </div>
                        <div class="form-group">
                            <label>低阈值</label>
                            <ExpressionEditor
                                :model-value="currentElement.lowExpression || ''"
                                @update:model-value="currentElement.lowExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: 0"
                            />
                        </div>
                        <div class="form-group">
                            <label>中阈值</label>
                            <ExpressionEditor
                                :model-value="currentElement.mediumExpression || ''"
                                @update:model-value="currentElement.mediumExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: 50"
                            />
                        </div>
                        <div class="form-group">
                            <label>高阈值</label>
                            <ExpressionEditor
                                :model-value="currentElement.highExpression || ''"
                                @update:model-value="currentElement.highExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: 100"
                            />
                        </div>
                    </template>

                    <!-- 绘图设置（分类图表） -->
                    <template v-if="['bar','bar3D','stackedBar','stackedBar3D','line','area','stackedArea'].includes(currentElement.chartType)">
                        <div style="border-top: 1px solid #e8e8e8; margin: 8px 0; padding-top: 8px;">
                            <label style="font-weight: 600; font-size: 12px; color: #666; margin-bottom: 6px; display: block;">绘图设置</label>
                        </div>
                        <div class="form-group" v-if="['line'].includes(currentElement.chartType)">
                            <label style="display: flex; align-items: center; gap: 4px;">
                                <input type="checkbox" v-model="currentElement.isShowShapes" />
                                显示数据点形状
                            </label>
                        </div>
                        <div class="form-group">
                            <label>标签颜色</label>
                            <input v-model="currentElement.itemLabelColor" type="color" style="width: 60px; height: 30px;" />
                        </div>
                        <div class="form-group">
                            <label>标签背景色</label>
                            <input v-model="currentElement.itemLabelBackgroundColor" type="color" style="width: 60px; height: 30px;" />
                        </div>
                        <div class="form-group">
                            <label>分类轴标签</label>
                            <ExpressionEditor
                                :model-value="currentElement.categoryAxisLabelExpression || ''"
                                @update:model-value="currentElement.categoryAxisLabelExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: $F{axis_label}"
                            />
                        </div>
                        <div class="form-group">
                            <label>值轴标签</label>
                            <ExpressionEditor
                                :model-value="currentElement.valueAxisLabelExpression || ''"
                                @update:model-value="currentElement.valueAxisLabelExpression = $event"
                                :report-fields="reportFields"
                                :report-parameters="reportParameters"
                                :report-variables="reportVariables"
                                placeholder="例如: Amount"
                            />
                        </div>
                    </template>

                    <!-- 饼图绘图设置 -->
                    <template v-if="['pie','pie3D'].includes(currentElement.chartType)">
                        <div style="border-top: 1px solid #e8e8e8; margin: 8px 0; padding-top: 8px;">
                            <label style="font-weight: 600; font-size: 12px; color: #666; margin-bottom: 6px; display: block;">绘图设置</label>
                        </div>
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 4px;">
                                <input type="checkbox" v-model="currentElement.isCircular" />
                                圆形显示
                            </label>
                        </div>
                        <div class="form-group">
                            <label>标签颜色</label>
                            <input v-model="currentElement.itemLabelColor" type="color" style="width: 60px; height: 30px;" />
                        </div>
                        <div class="form-group">
                            <label>标签背景色</label>
                            <input v-model="currentElement.itemLabelBackgroundColor" type="color" style="width: 60px; height: 30px;" />
                        </div>
                    </template>

                    <!-- 超链接设置 -->
                    <div style="border-top: 1px solid #e8e8e8; margin: 8px 0; padding-top: 8px;">
                        <label style="font-weight: 600; font-size: 12px; color: #666; margin-bottom: 6px; display: block;">超链接</label>
                    </div>
                    <div class="form-group">
                        <label>工具提示表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.hyperlinkTooltipExpression || ''"
                            @update:model-value="currentElement.hyperlinkTooltipExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                        />
                    </div>
                    <div class="form-group">
                        <label>超链接类型</label>
                        <select v-model="currentElement.hyperlinkType">
                            <option value="">无</option>
                            <option value="Reference">Reference</option>
                            <option value="LocalAnchor">LocalAnchor</option>
                            <option value="LocalPage">LocalPage</option>
                            <option value="RemoteAnchor">RemoteAnchor</option>
                            <option value="RemotePage">RemotePage</option>
                            <option value="Tooltip">Tooltip</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>超链接目标</label>
                        <select v-model="currentElement.hyperlinkTarget">
                            <option value="">默认</option>
                            <option value="Self">Self</option>
                            <option value="Blank">Blank</option>
                            <option value="Top">Top</option>
                            <option value="Parent">Parent</option>
                        </select>
                    </div>
                    <div class="form-group" v-if="currentElement.hyperlinkType">
                        <label>超链接表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.hyperlinkExpression || ''"
                            @update:model-value="currentElement.hyperlinkExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                        />
                    </div>
                    <div class="form-group">
                        <label>书签级别</label>
                        <input v-model.number="currentElement.bookmarkLevel" type="number" min="0" max="10" />
                    </div>
                </n-tab-pane>

                <!-- 条码属性标签页 -->
                <n-tab-pane
                    v-if="currentElement && currentElement.type === 'barcode'"
                    name="barcode"
                    :tab="'条码属性'"
                >
                    <div class="form-group">
                        <label>条码类型</label>
                        <select v-model="currentElement.barcodeType">
                            <option value="Code128">Code128</option>
                            <option value="Code39">Code39</option>
                            <option value="EAN13">EAN13</option>
                            <option value="EAN8">EAN8</option>
                            <option value="UPCA">UPC-A</option>
                            <option value="UPCE">UPC-E</option>
                            <option value="QRCode">QR Code</option>
                            <option value="DataMatrix">Data Matrix</option>
                            <option value="Interleaved2Of5">Interleaved 2 of 5</option>
                            <option value="Codabar">Codabar</option>
                            <option value="EAN128">EAN128</option>
                            <option value="PDF417">PDF417</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>条码表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.codeExpression || ''"
                            @update:model-value="currentElement.codeExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                            placeholder='例如: "1234567890"'
                        />
                    </div>
                </n-tab-pane>

                <!-- 地图属性标签页 -->
                <n-tab-pane
                    v-if="currentElement && currentElement.type === 'map'"
                    name="map"
                    :tab="'地图属性'"
                >
                    <div class="form-group">
                        <label>地图类型</label>
                        <select v-model="currentElement.mapType">
                            <option value="html">HTML</option>
                            <option value="image">图片</option>
                            <option value="pdf">PDF</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>纬度表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.latExpression || ''"
                            @update:model-value="currentElement.latExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                        />
                    </div>
                    <div class="form-group">
                        <label>经度表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.lngExpression || ''"
                            @update:model-value="currentElement.lngExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                        />
                    </div>
                    <div class="form-group">
                        <label>缩放级别表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.zoomExpression || ''"
                            @update:model-value="currentElement.zoomExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                        />
                    </div>
                    <div class="form-group">
                        <label>语言表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.languageExpression || ''"
                            @update:model-value="currentElement.languageExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                        />
                    </div>
                </n-tab-pane>

                <!-- 交叉表属性标签页 -->
                <n-tab-pane
                    v-if="currentElement && currentElement.type === 'crosstab'"
                    name="crosstab"
                    :tab="'交叉表属性'"
                >
                    <div class="form-group">
                        <label>交叉表宽度</label>
                        <input
                            v-model.number="currentElement.crosstabWidth"
                            type="number"
                            min="0"
                            placeholder="像素"
                        />
                    </div>
                    <div class="form-group">
                        <label>交叉表高度</label>
                        <input
                            v-model.number="currentElement.crosstabHeight"
                            type="number"
                            min="0"
                            placeholder="像素"
                        />
                    </div>
                    <div class="form-group">
                        <label>无数据时显示</label>
                        <select v-model="currentElement.whenNoDataType">
                            <option value="AllSectionsNoDetail">所有区域无详情</option>
                            <option value="AllSectionsWithDetail">所有区域包含详情</option>
                            <option value="NoDataCell">无数据单元格</option>
                            <option value="Blank">空白</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>求值时间</label>
                        <select v-model="currentElement.evaluationTime">
                            <option value="Now">Now - 立即求值</option>
                            <option value="Report">Report - 报表结束时</option>
                            <option value="Page">Page - 页面结束时</option>
                            <option value="Column">Column - 列结束时</option>
                            <option value="Group">Group - 组结束时</option>
                            <option value="Band">Band - 区域结束时</option>
                            <option value="Auto">Auto - 引擎决定</option>
                            <option value="Master">Master - 主报表结束时</option>
                        </select>
                    </div>
                </n-tab-pane>

                <!-- 图标标签属性标签页 -->
                <n-tab-pane
                    v-if="currentElement && currentElement.type === 'iconLabel'"
                    name="iconLabel"
                    :tab="'图标标签属性'"
                >
                    <div class="form-group">
                        <label>图标</label>
                        <input
                            v-model="currentElement.icon"
                            type="text"
                            placeholder="输入图标名称或 emoji，例如: 📊、📊"
                        />
                    </div>
                    <div class="form-group">
                        <label>静态标签</label>
                        <input
                            v-model="currentElement.label"
                            type="text"
                            placeholder="输入固定标签文本"
                        />
                    </div>
                    <div class="form-group">
                        <label>标签表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.labelExpression || ''"
                            @update:model-value="currentElement.labelExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                        />
                    </div>
                    <div class="form-group">
                        <label>求值时间</label>
                        <select v-model="currentElement.evaluationTime">
                            <option value="Now">Now - 立即求值</option>
                            <option value="Report">Report - 报表结束时</option>
                            <option value="Page">Page - 页面结束时</option>
                            <option value="Column">Column - 列结束时</option>
                            <option value="Group">Group - 组结束时</option>
                            <option value="Band">Band - 区域结束时</option>
                            <option value="Auto">Auto - 引擎决定</option>
                            <option value="Master">Master - 主报表结束时</option>
                        </select>
                    </div>
                </n-tab-pane>

                <!-- 通用元素属性标签页 -->
                <n-tab-pane
                    v-if="currentElement && currentElement.type === 'genericElement'"
                    name="genericElement"
                    :tab="'通用元素属性'"
                >
                    <div class="form-group">
                        <label>命名空间</label>
                        <input v-model="currentElement.namespace" type="text" placeholder="例如: http://example.com/namespace" />
                    </div>
                    <div class="form-group">
                        <label>求值时间</label>
                        <select v-model="currentElement.evaluationTime">
                            <option value="Now">Now - 立即求值</option>
                            <option value="Report">Report - 报表结束时</option>
                            <option value="Page">Page - 页面结束时</option>
                            <option value="Column">Column - 列结束时</option>
                            <option value="Group">Group - 组结束时</option>
                            <option value="Band">Band - 区域结束时</option>
                            <option value="Auto">Auto - 引擎决定</option>
                            <option value="Master">Master - 主报表结束时</option>
                        </select>
                    </div>
                </n-tab-pane>

                <!-- 排序属性标签页 -->
                <n-tab-pane
                    v-if="currentElement && currentElement.type === 'sort'"
                    name="sort"
                    :tab="'排序属性'"
                >
                    <div class="form-group">
                        <label>排序字段</label>
                        <div v-if="currentElement.sortFields && currentElement.sortFields.length > 0">
                            <div v-for="(field, index) in currentElement.sortFields" :key="index" class="sort-field-item">
                                <input v-model="field.name" type="text" placeholder="字段名" class="sort-field-name" />
                                <select v-model="field.order" class="sort-field-order">
                                    <option value="Ascending">升序</option>
                                    <option value="Descending">降序</option>
                                </select>
                                <button @click="removeSortField(index)" class="sort-field-remove">删除</button>
                            </div>
                        </div>
                        <button @click="addSortField" class="add-sort-field">添加排序字段</button>
                    </div>
                    <div class="form-group">
                        <label>求值时间</label>
                        <select v-model="currentElement.evaluationTime">
                            <option value="Now">Now - 立即求值</option>
                            <option value="Report">Report - 报表结束时</option>
                            <option value="Page">Page - 页面结束时</option>
                            <option value="Column">Column - 列结束时</option>
                            <option value="Group">Group - 组结束时</option>
                            <option value="Band">Band - 区域结束时</option>
                            <option value="Auto">Auto - 引擎决定</option>
                            <option value="Master">Master - 主报表结束时</option>
                        </select>
                    </div>
                </n-tab-pane>

                <!-- 列表属性标签页 -->
                <n-tab-pane
                    v-if="currentElement && currentElement.type === 'list'"
                    name="list"
                    :tab="'列表属性'"
                >
                    <div class="form-group">
                        <label>打印顺序</label>
                        <select v-model="currentElement.printOrder">
                            <option value="Vertical">Vertical - 垂直</option>
                            <option value="Horizontal">Horizontal - 水平</option>
                        </select>
                    </div>
                    <div class="form-group" v-if="currentElement.printOrder === 'Horizontal'">
                        <label style="display: flex; align-items: center; gap: 4px;">
                            <input type="checkbox" v-model="currentElement.ignoreWidth" />
                            忽略宽度（继续渲染）
                        </label>
                    </div>
                    <div class="form-group">
                        <label>子数据集名称</label>
                        <input v-model="currentElement.subDataset" type="text" placeholder="例如: Addresses" />
                    </div>
                    <div class="form-group">
                        <label>数据源表达式</label>
                        <ExpressionEditor
                            :model-value="currentElement.dataSourceExpression || ''"
                            @update:model-value="currentElement.dataSourceExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                            placeholder='例如: $P{myDatasource}'
                        />
                    </div>
                    <div class="form-group">
                        <label>连接表达式（可选）</label>
                        <ExpressionEditor
                            :model-value="currentElement.connectionExpression || ''"
                            @update:model-value="currentElement.connectionExpression = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                            placeholder='例如: $P{connection}'
                        />
                    </div>
                    <div class="form-group">
                        <label>列表内容高度</label>
                        <input
                            v-model.number="listContentsHeight"
                            type="number"
                            min="0"
                            placeholder="像素"
                            @change="updateListContentsHeight"
                        />
                    </div>
                    <div class="form-group">
                        <label>列表内容宽度</label>
                        <input
                            v-model.number="listContentsWidth"
                            type="number"
                            min="0"
                            placeholder="像素"
                            @change="updateListContentsWidth"
                        />
                    </div>
                    <div class="form-group">
                        <label>分页类型</label>
                        <select v-model="currentElement.splitType">
                            <option value="Stretch">Stretch - 拉伸</option>
                            <option value="Prevent">Prevent - 防止分割</option>
                            <option value="Immediate">Immediate - 立即分割</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>求值时间</label>
                        <select v-model="currentElement.evaluationTime">
                            <option value="Now">Now - 立即求值</option>
                            <option value="Report">Report - 报表结束时</option>
                            <option value="Page">Page - 页面结束时</option>
                            <option value="Column">Column - 列结束时</option>
                            <option value="Group">Group - 组结束时</option>
                            <option value="Band">Band - 区域结束时</option>
                            <option value="Auto">Auto - 引擎决定</option>
                        </select>
                    </div>
                    <div
                        class="form-group"
                        v-if="currentElement.evaluationTime === 'Group'"
                    >
                        <label>求值组</label>
                        <ExpressionEditor
                            :model-value="currentElement.evaluationGroup || ''"
                            @update:model-value="currentElement.evaluationGroup = $event"
                            :report-fields="reportFields"
                            :report-parameters="reportParameters"
                            :report-variables="reportVariables"
                            placeholder="输入组名称"
                        />
                    </div>
                </n-tab-pane>

            </n-tabs>

            <div class="element-actions">
                <n-button @click="deleteElement" type="error">{{
                    t("properties.deleteElement")
                }}</n-button>
            </div>
        </div>
    </div>

    <!-- 样式管理模态框 -->
    <BaseModal
        :visible="showStyleManagerModal"
        :title="t('properties.styleManagement')"
        @update:visible="showStyleManagerModal = $event"
        @confirm="saveStyleChanges"
        @cancel="cancelStyleChanges"
    >
        <div class="style-manager-content">
            <div
                v-for="(style, index) in reportStyles"
                :key="index"
                class="style-item"
            >
                <h4>{{ style.name }}</h4>
                <div class="style-properties">
                    <!-- 背景模式设置 -->
                    <div class="form-group">
                        <label>{{ t("properties.backgroundMode") }}</label>
                        <select
                            v-model="style.mode"
                            @change="emit('update-jrxml')"
                        >
                            <option :value="undefined">
                                {{ t("properties.defaultTransparent") }}
                            </option>
                            <option value="Transparent">
                                {{ t("properties.transparent") }}
                            </option>
                            <option value="Opaque">
                                {{ t("properties.opaque") }}
                            </option>
                        </select>
                    </div>

                    <!-- 前景颜色设置 -->
                    <div class="form-group">
                        <label>{{ t("properties.forecolor") }}</label>
                        <ColorPickerWithOpacity
                            v-model="style.forecolor"
                            v-model:mode="style.forecolorMode"
                            @update:modelValue="emit('update-jrxml')"
                            @update:mode="emit('update-jrxml')"
                        />
                    </div>

                    <!-- 背景颜色设置 -->
                    <div class="form-group">
                        <label>{{ t("properties.backgroundColor") }}</label>
                        <ColorPickerWithOpacity
                            v-model="style.backcolor"
                            v-model:mode="style.mode"
                            @update:modelValue="emit('update-jrxml')"
                            @update:mode="emit('update-jrxml')"
                        />
                    </div>

                    <!-- 水平文本对齐 -->
                    <div class="form-group">
                        <label>{{ t("properties.hTextAlign") }}</label>
                        <select
                            v-model="style.hTextAlign"
                            @change="emit('update-jrxml')"
                        >
                            <option :value="undefined">
                                {{ t("properties.default") }}
                            </option>
                            <option value="Left">
                                {{ t("properties.left") }}
                            </option>
                            <option value="Center">
                                {{ t("properties.center") }}
                            </option>
                            <option value="Right">
                                {{ t("properties.right") }}
                            </option>
                            <option value="Justified">
                                {{ t("properties.justified") }}
                            </option>
                        </select>
                    </div>

                    <!-- 水平图片对齐 -->
                    <div class="form-group">
                        <label>{{ t("properties.hImageAlign") }}</label>
                        <select
                            v-model="style.hImageAlign"
                            @change="emit('update-jrxml')"
                        >
                            <option :value="undefined">
                                {{ t("properties.default") }}
                            </option>
                            <option value="Left">
                                {{ t("properties.left") }}
                            </option>
                            <option value="Center">
                                {{ t("properties.center") }}
                            </option>
                            <option value="Right">
                                {{ t("properties.right") }}
                            </option>
                        </select>
                    </div>

                    <!-- 垂直文本对齐 -->
                    <div class="form-group">
                        <label>{{ t("properties.vTextAlign") }}</label>
                        <select
                            v-model="style.vTextAlign"
                            @change="emit('update-jrxml')"
                        >
                            <option :value="undefined">
                                {{ t("properties.default") }}
                            </option>
                            <option value="Top">
                                {{ t("properties.top") }}
                            </option>
                            <option value="Middle">
                                {{ t("properties.middle") }}
                            </option>
                            <option value="Bottom">
                                {{ t("properties.bottom") }}
                            </option>
                        </select>
                    </div>

                    <!-- 垂直图片对齐 -->
                    <div class="form-group">
                        <label>{{ t("properties.vImageAlign") }}</label>
                        <select
                            v-model="style.vImageAlign"
                            @change="emit('update-jrxml')"
                        >
                            <option :value="undefined">
                                {{ t("properties.default") }}
                            </option>
                            <option value="Top">
                                {{ t("properties.top") }}
                            </option>
                            <option value="Middle">
                                {{ t("properties.middle") }}
                            </option>
                            <option value="Bottom">
                                {{ t("properties.bottom") }}
                            </option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NTabs, NTabPane, NRadioGroup, NRadioButton } from "naive-ui";
import type { Band, SelectedElementInfo, TableDataset } from "../../../types";
import { getAvailableFonts } from "../../../utils/fontUtils";
import BaseModal from "../../modals/BaseModal.vue";
import ColorPickerWithOpacity from "./ColorPickerWithOpacity.vue";
import FontStyleSettings from "./FontStyleSettings.vue";
import BorderStyleSettings from "./BorderStyleSettings.vue";
import ElementTypeBasedSettings from "./ElementTypeBasedSettings.vue";
import FrameProperties from "./FrameProperties.vue";
import TableProperties from "./TableProperties.vue";
import ColumnTreeNode from "./ColumnTreeNode.vue";
import ExpressionEditor from "./common/ExpressionEditor.vue";
import { useLivePreview } from "@/composables/useLivePreview";
import {
    syncTableColumns,
    createDefaultColumn,
    createDefaultColumnGroup,
    findInParentArray,
    ungroupColumnGroup,
} from "../../../utils/table/ColumnTreeSync";
import { TableUtils } from "../../../utils/table/ColumnFactory";
import type {
    Column,
    ColumnGroup,
    BaseColumn,
    TableElement,
} from "../../../types/table";
import SwitchControl from "./common/SwitchControl.vue";

const { t } = useI18n();

interface Props {
    selectedBandIndex: number | null;
    selectedElement: SelectedElementInfo | null;
    bands: Band[];
    reportProperties: any;
    subDatasets?: TableDataset[];
    reportStyles?: any[];
    reportFields?: Array<{ name: string; class?: string }>;
    reportParameters?: Array<{ name: string; class?: string }>;
    reportVariables?: Array<{ name: string; class?: string }>;
}

interface Emits {
    (e: "update:bands", bands: Band[]): void;
    (e: "delete-element"): void;
    (e: "update-jrxml"): void;
    (e: "save-state"): void;
    (e: "update:reportStyles", styles: any[]): void;
    (
        e: "add-columns-to-group",
        params: {
            elementIndex: number;
            columnIndices: number[];
            bandIndex: number;
            parentFrameIndex?: number;
        },
    ): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 实时预览（用于过渡动画）
const { previewConfig, startPreview, stopPreview, confirmPreview } =
    useLivePreview({
        animated: true,
        animationDuration: 150,
    });

// 可用字体列表
const availableFonts = ref<string[]>([]);

onMounted(async () => {
    availableFonts.value = await getAvailableFonts();
});

// 计算属性
const currentElement = computed(() => {
    if (props.selectedElement && props.bands && Array.isArray(props.bands)) {
        const band = props.bands[props.selectedElement.bandIndex];
        if (band && band.elements && Array.isArray(band.elements)) {
            // 检查是否是嵌套在Frame中的元素
            if (props.selectedElement.parentFrameIndex !== undefined) {
                const frame =
                    band.elements[props.selectedElement.parentFrameIndex];
                if (frame && frame.type === "frame" && frame.elements) {
                    return frame.elements[props.selectedElement.elementIndex];
                }
            } else {
                return band.elements[props.selectedElement.elementIndex];
            }
        }
    }
    return null;
});

// 计算当前元素类型
const elementType = computed(() => {
    return currentElement.value?.type || "";
});

// 表格行高设置
const tableRowHeights = ref({
    tableHeader: 30,
    columnHeader: 30,
    detailCell: 30,
    columnFooter: 30,
    tableFooter: 30,
});

// 表格样式选择
const tableStyles = ref({
    tableHeader: "Table_TH",
    columnHeader: "Table_CH",
    columnFooter: "Table_CH",
    detailCell: "Table_TD",
});

// 样式管理模态框控制
const showStyleManagerModal = ref(false);

// Frame属性更新处理
const handleFramePropertyUpdate = (updatedElement: any) => {
    if (currentElement.value && props.selectedElement) {
        const band = props.bands[props.selectedElement.bandIndex];
        if (band && band.elements) {
            if (props.selectedElement.parentFrameIndex !== undefined) {
                const frame =
                    band.elements[props.selectedElement.parentFrameIndex];
                if (frame && frame.type === "frame" && frame.elements) {
                    frame.elements[props.selectedElement.elementIndex] =
                        updatedElement;
                }
            } else {
                band.elements[props.selectedElement.elementIndex] =
                    updatedElement;
            }
            emit("update:bands", props.bands);
            emit("update-jrxml");
        }
    }
};

// Table属性更新处理
const handleTablePropertyUpdate = (updatedElement: any) => {
    if (currentElement.value && props.selectedElement) {
        const band = props.bands[props.selectedElement.bandIndex];
        if (band && band.elements) {
            if (props.selectedElement.parentFrameIndex !== undefined) {
                const frame =
                    band.elements[props.selectedElement.parentFrameIndex];
                if (frame && frame.type === "frame" && frame.elements) {
                    frame.elements[props.selectedElement.elementIndex] =
                        updatedElement;
                }
            } else {
                band.elements[props.selectedElement.elementIndex] =
                    updatedElement;
            }
            emit("update:bands", props.bands);
            emit("update-jrxml");
        }
    }
};

// 添加列
const addColumn = () => {
    if (currentElement.value && currentElement.value.type === "table") {
        if (!currentElement.value.columns) {
            currentElement.value.columns = [];
        }
        const newColumn = {
            uuid: crypto.randomUUID(),
            name: `列 ${currentElement.value.columns.length + 1}`,
            width: 100,
            columnHeader: {
                enable: true,
                element: {
                    type: "staticText",
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 30,
                    text: `列 ${currentElement.value.columns.length + 1}`,
                    textAlignment: "Center",
                    verticalAlignment: "Middle",
                },
            },
            detailCell: {
                enable: true,
                element: {
                    type: "textField",
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 30,
                    expression: "",
                    textAlignment: "Center",
                    verticalAlignment: "Middle",
                },
            },
        };
        (currentElement.value as any).columns.push(newColumn);
        emit("update-jrxml");
    }
};

// 删除列
const removeColumn = (index: number) => {
    if (
        currentElement.value &&
        currentElement.value.type === "table" &&
        currentElement.value.columns
    ) {
        currentElement.value.columns.splice(index, 1);
        emit("update-jrxml");
    }
};

// ==================== 列组合树管理 ====================

const tableChildren = computed<(Column | ColumnGroup)[]>(() => {
    if (!currentElement.value || currentElement.value.type !== "table")
        return [];
    const el = currentElement.value as TableElement;
    if (el.children && el.children.length > 0) return el.children;
    // 没有 children 时从 columns 初始化
    return el.columns || [];
});

function syncAndEmit() {
    if (!currentElement.value || currentElement.value.type !== "table") return;
    const el = currentElement.value as TableElement;
    // 确保 children 存在
    if (!el.children) {
        el.children = [...(el.columns || [])];
    }
    syncTableColumns(el);
    emit("update-jrxml");
}

function ensureChildren() {
    if (!currentElement.value || currentElement.value.type !== "table") return;
    const el = currentElement.value as TableElement;
    if (!el.children) {
        el.children = [...(el.columns || [])];
    }
}

function handleAddRootColumn() {
    if (!currentElement.value || currentElement.value.type !== "table") return;
    emit("save-state");
    ensureChildren();
    const el = currentElement.value as TableElement;
    const count = (el.children || []).length;
    const newCol = createDefaultColumn(`列 ${count + 1}`);
    el.children!.push(newCol);
    syncAndEmit();
}

function handleAddRootGroup() {
    if (!currentElement.value || currentElement.value.type !== "table") return;
    emit("save-state");
    ensureChildren();
    const el = currentElement.value as TableElement;
    const count = (el.children || []).filter((c) => "children" in c).length;
    const newGroup = createDefaultColumnGroup(`分组 ${count + 1}`);
    el.children!.push(newGroup);
    syncAndEmit();
}

function handleColumnNodeUpdate(uuid: string, updates: Partial<BaseColumn>) {
    emit("save-state");
    ensureChildren();
    const el = currentElement.value as TableElement;
    const result = findInParentArray(el.children!, uuid);
    if (result) {
        const node = result.parent[result.index];
        if (node) {
            Object.assign(node, updates);
            // 如果更新了宽度，需要同步
            if (updates.width !== undefined) {
                TableUtils.updateAllColumnGroupWidths(el.children!);
            }
            // 如果更新了名称，同步到单元格
            if (updates.name !== undefined) {
                if (node.columnHeader?.element) {
                    node.columnHeader.element.text = updates.name;
                }
            }
        }
    }
    syncAndEmit();
}

function handleColumnNodeDelete(uuid: string) {
    emit("save-state");
    ensureChildren();
    const el = currentElement.value as TableElement;
    const result = findInParentArray(el.children!, uuid);
    if (result) {
        result.parent.splice(result.index, 1);
    }
    syncAndEmit();
}

function handleAddColumnAfter(afterUuid: string) {
    emit("save-state");
    ensureChildren();
    const el = currentElement.value as TableElement;
    const result = findInParentArray(el.children!, afterUuid);
    if (result) {
        const newCol = createDefaultColumn(`列 ${result.parent.length + 1}`);
        result.parent.splice(result.index + 1, 0, newCol);
    }
    syncAndEmit();
}

function handleAddColumnChild(groupUuid: string) {
    emit("save-state");
    ensureChildren();
    const el = currentElement.value as TableElement;
    const result = findInParentArray(el.children!, groupUuid);
    if (result) {
        const group = result.parent[result.index] as ColumnGroup;
        if (group && "children" in group) {
            const newCol = createDefaultColumn(
                `列 ${group.children.length + 1}`,
            );
            group.children.push(newCol);
        }
    }
    syncAndEmit();
}

function handleAddColumnGroupAfter(afterUuid: string) {
    emit("save-state");
    ensureChildren();
    const el = currentElement.value as TableElement;
    const result = findInParentArray(el.children!, afterUuid);
    if (result) {
        const newGroup = createDefaultColumnGroup(
            `分组 ${result.parent.length + 1}`,
        );
        result.parent.splice(result.index + 1, 0, newGroup);
    }
    syncAndEmit();
}

function handleUngroupNode(groupUuid: string) {
    emit("save-state");
    ensureChildren();
    const el = currentElement.value as TableElement;
    ungroupColumnGroup(el.children!, groupUuid);
    syncAndEmit();
}

function handleMoveNode(uuid: string, direction: "up" | "down") {
    emit("save-state");
    ensureChildren();
    const el = currentElement.value as TableElement;
    const result = findInParentArray(el.children!, uuid);
    if (!result) return;
    const { parent, index } = result;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= parent.length) return;
    const temp = parent[index];
    const target = parent[targetIndex];
    if (temp && target) {
        parent[index] = target;
        parent[targetIndex] = temp;
    }
    syncAndEmit();
}

// 报表样式管理
const reportStyles = ref<any[]>(
    props.reportStyles || [
        {
            name: "Table_TH",
            mode: "Opaque",
            backcolor: "#F0F8FF",
            forecolor: "#000000",
            forecolorMode: "Opaque",
            hTextAlign: "Center",
            hImageAlign: "Center",
            vTextAlign: "Middle",
            vImageAlign: "Middle",
            box: {
                pen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                topPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                leftPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                bottomPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                rightPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
            },
        },
        {
            name: "Table_CH",
            mode: "Opaque",
            backcolor: "#BFE1FF",
            forecolor: "#000000",
            forecolorMode: "Opaque",
            hTextAlign: "Center",
            hImageAlign: "Center",
            vTextAlign: "Middle",
            vImageAlign: "Middle",
            box: {
                pen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                topPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                leftPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                bottomPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                rightPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
            },
        },
        {
            name: "Table_TD",
            mode: "Opaque",
            backcolor: "#FFFFFF",
            forecolor: "#000000",
            forecolorMode: "Opaque",
            hTextAlign: "Left",
            hImageAlign: "Left",
            vTextAlign: "Middle",
            vImageAlign: "Middle",
            box: {
                pen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                topPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                leftPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                bottomPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                rightPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
            },
        },
    ],
);

// 保存样式更改
function saveStyleChanges() {
    emit("update:reportStyles", reportStyles.value);
    emit("update-jrxml");
    showStyleManagerModal.value = false;
}

// 取消样式更改
function cancelStyleChanges() {
    // 重置样式为原始状态
    reportStyles.value = props.reportStyles || [
        {
            name: "Table_TH",
            mode: "Opaque",
            backcolor: "#F0F8FF",
            forecolor: "#000000",
            forecolorMode: "Opaque",
            hTextAlign: "Center",
            hImageAlign: "Center",
            vTextAlign: "Middle",
            vImageAlign: "Middle",
            box: {
                pen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                topPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                leftPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                bottomPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                rightPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
            },
        },
        {
            name: "Table_CH",
            mode: "Opaque",
            backcolor: "#BFE1FF",
            forecolor: "#000000",
            forecolorMode: "Opaque",
            hTextAlign: "Center",
            hImageAlign: "Center",
            vTextAlign: "Middle",
            vImageAlign: "Middle",
            box: {
                pen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                topPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                leftPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                bottomPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                rightPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
            },
        },
        {
            name: "Table_TD",
            mode: "Opaque",
            backcolor: "#FFFFFF",
            forecolor: "#000000",
            forecolorMode: "Opaque",
            hTextAlign: "Left",
            hImageAlign: "Left",
            vTextAlign: "Middle",
            vImageAlign: "Middle",
            box: {
                pen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                topPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                leftPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                bottomPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
                rightPen: {
                    lineWidth: 0.5,
                    lineColor: "#000000",
                },
            },
        },
    ];
    showStyleManagerModal.value = false;
}

// 当表格元素变化时，更新行高设置和样式选择
watch(
    () => currentElement.value,
    (newElement) => {
        if (newElement && newElement.type === "table") {
            // 从列中获取当前行高值（除以 rowSpan 还原单行高度）
            // 优先从 columns 数组获取，如果为空则从 children 数组获取
            let firstColumn: any = null;
            if (newElement.columns && newElement.columns.length > 0) {
                firstColumn = newElement.columns[0];
            } else if (newElement.children && newElement.children.length > 0) {
                // 从 children 中找到第一个普通列
                for (const item of newElement.children) {
                    if ('detailCell' in item) {
                        firstColumn = item;
                        break;
                    }
                }
            }

            if (firstColumn) {
                console.log("Watch触发! firstColumn.columnHeader:", {
                    height: firstColumn.columnHeader?.height,
                    rowSpan: firstColumn.columnHeader?.rowSpan,
                    elementHeight: firstColumn.columnHeader?.element?.height,
                });

                const getBaseHeight = (cell: any) => {
                    const h = cell?.element?.height ?? cell?.height;
                    if (h === undefined || h === null || h === 0) {
                        return undefined;
                    }
                    const rs = cell?.rowSpan || 1;
                    const result = rs > 1 ? Math.round(h / rs) : h;
                    console.log("getBaseHeight:", { inputHeight: h, rowSpan: rs, result });
                    return result;
                };
                console.log("Watch更新tableRowHeights前的firstColumn.columnHeader:", firstColumn.columnHeader);
                const headerHeight = getBaseHeight(firstColumn.tableHeader);
                const colHeaderHeight = getBaseHeight(firstColumn.columnHeader);
                const detailHeight = getBaseHeight(firstColumn.detailCell);
                const footerHeight = getBaseHeight(firstColumn.columnFooter);
                const tableFooterHeight = getBaseHeight(firstColumn.tableFooter);

                console.log("Watch计算出的高度:", { headerHeight, colHeaderHeight, detailHeight, footerHeight, tableFooterHeight });

                // 只有当获取到有效值时才更新，避免覆盖用户输入的值
                if (headerHeight !== undefined) {
                    tableRowHeights.value.tableHeader = headerHeight;
                }
                if (colHeaderHeight !== undefined) {
                    console.log("Watch更新tableRowHeights.columnHeader:", colHeaderHeight);
                    tableRowHeights.value.columnHeader = colHeaderHeight;
                }
                if (detailHeight !== undefined) {
                    tableRowHeights.value.detailCell = detailHeight;
                }
                if (footerHeight !== undefined) {
                    tableRowHeights.value.columnFooter = footerHeight;
                }
                if (tableFooterHeight !== undefined) {
                    tableRowHeights.value.tableFooter = tableFooterHeight;
                }

                // 更新表格样式选择
                tableStyles.value.tableHeader =
                    (firstColumn.tableHeader as any)?.style ?? "Table_TH";
                tableStyles.value.columnHeader =
                    (firstColumn.columnHeader as any)?.style ?? "Table_CH";
                tableStyles.value.columnFooter =
                    (firstColumn.columnFooter as any)?.style ?? "Table_CH";
                tableStyles.value.detailCell =
                    (firstColumn.detailCell as any)?.style ?? "Table_TD";
            }
        }
    },
    { deep: true, immediate: true },
);

// 更新所有列的行高
function updateAllColumnRowHeights() {
    if (!currentElement.value || currentElement.value.type !== "table") return;

    // 收集所有要处理的列，避免重复
    const processedColumns = new Set<string>();

    console.log("开始更新所有列的行高:", {
        tableRowHeights: tableRowHeights.value,
        columnCount: currentElement.value.columns
            ? currentElement.value.columns.length
            : 0,
        groupCount: currentElement.value.children
            ? currentElement.value.children.length
            : 0,
    });

    // 处理普通列
    if (currentElement.value.columns) {
        currentElement.value.columns.forEach((column) => {
            if (!processedColumns.has(column.uuid)) {
                processedColumns.add(column.uuid);
                updateColumnRowHeights(column);
            } else {
                console.log("跳过重复列:", column.name || column.uuid);
            }
        });
        console.log("普通列行高更新完成");
    }

    // 处理分组列
    if (currentElement.value.children) {
        currentElement.value.children.forEach((item) => {
            // 检查是分组还是普通列
            if ('children' in item && item.children && item.children.length > 0) {
                // 是ColumnGroup，递归处理
                updateGroupRowHeights(item);
            } else if ('detailCell' in item) {
                // 是TableColumn（普通列），直接更新detailCell
                console.log("更新顶层普通列detailCell:", item.name || item.uuid);
                updateColumnRowHeights(item);
            }
        });
        console.log("分组列行高更新完成");
    }

    console.log("所有列行高更新完成，表格元素:", currentElement.value);

    // 在 emit 前检查合并列的高度
    const tableElement = currentElement.value as any;
    if (tableElement?.columns) {
        tableElement.columns.forEach((col: any) => {
            if (col.columnHeader && col.columnHeader.rowSpan && col.columnHeader.rowSpan > 1) {
                console.log("emit前检查合并列:", {
                    列名: col.name,
                    columnHeaderHeight: col.columnHeader.height,
                    elementHeight: col.columnHeader.element?.height,
                    rowSpan: col.columnHeader.rowSpan,
                });
            }
        });
    }

    // 使用nextTick确保Vue完成更新后再触发事件，避免嵌套响应式属性追踪不及时的问题
    nextTick(() => {
        console.log("nextTick: 触发更新事件");

        // 在 nextTick 中再次检查高度
        if (tableElement?.columns) {
            tableElement.columns.forEach((col: any) => {
                if (col.columnHeader && col.columnHeader.rowSpan && col.columnHeader.rowSpan > 1) {
                    console.log("nextTick中检查合并列:", {
                        列名: col.name,
                        columnHeaderHeight: col.columnHeader.height,
                        elementHeight: col.columnHeader.element?.height,
                        rowSpan: col.columnHeader.rowSpan,
                    });
                }
            });
        }

        emit("update:bands", props.bands);

        // emit后立即检查
        console.log("emit后立即检查合并列:");
        if (tableElement?.columns) {
            tableElement.columns.forEach((col: any) => {
                if (col.columnHeader && col.columnHeader.rowSpan && col.columnHeader.rowSpan > 1) {
                    console.log("emit后检查合并列:", {
                        列名: col.name,
                        columnHeaderHeight: col.columnHeader.height,
                        elementHeight: col.columnHeader.element?.height,
                        rowSpan: col.columnHeader.rowSpan,
                    });
                }
            });
        }

        // 检查Vue是否在下一tick中修改了高度
        nextTick(() => {
            console.log("第二个nextTick检查合并列:");
            if (tableElement?.columns) {
                tableElement.columns.forEach((col: any) => {
                    if (col.columnHeader && col.columnHeader.rowSpan && col.columnHeader.rowSpan > 1) {
                        console.log("第二个nextTick检查:", {
                            列名: col.name,
                            columnHeaderHeight: col.columnHeader.height,
                            elementHeight: col.columnHeader.element?.height,
                            rowSpan: col.columnHeader.rowSpan,
                        });
                    }
                });
            }
        });

        emit("update-jrxml");
    });
}

// 更新单个列的行高
function updateColumnRowHeights(column: any) {
    console.log("开始更新列的行高:", column);

    if (column.tableHeader) {
        // 更新tableHeader本身的高度
        const tableHeaderHeight = tableRowHeights.value.tableHeader;
        column.tableHeader.height = tableHeaderHeight;
        console.log("更新tableHeader高度:", tableHeaderHeight);

        // 直接更新内部元素的高度，因为这些元素直接包含textField或staticText，而不是通过elements数组
        // 检查并更新reportElement的高度
        if (column.tableHeader.reportElement) {
            column.tableHeader.reportElement.height = tableHeaderHeight;
        } else if (column.tableHeader.element) {
            // 更新内部元素的height属性，确保设计区域渲染同步更新
            column.tableHeader.element.height = tableHeaderHeight;
        }

        // 如果是合并列，更新高度为行高乘以行跨度
        if (column.tableHeader.rowSpan && column.tableHeader.rowSpan > 1) {
            const mergedHeight = tableHeaderHeight * column.tableHeader.rowSpan;
            column.tableHeader.height = mergedHeight;

            // 内部元素高度也需要相应调整
            if (column.tableHeader.reportElement) {
                column.tableHeader.reportElement.height = mergedHeight;
            } else if (column.tableHeader.element) {
                column.tableHeader.element.height = mergedHeight;
            }
        }
    }

    if (column.columnHeader) {
        // 更新columnHeader本身的高度
        const columnHeaderHeight = tableRowHeights.value.columnHeader;
        console.log("更新columnHeader高度前:", {
            当前值: column.columnHeader.height,
            新值: columnHeaderHeight,
            rowSpan: column.columnHeader.rowSpan,
            element当前值: column.columnHeader.element?.height,
        });
        column.columnHeader.height = columnHeaderHeight;
        console.log("更新columnHeader.height后:", {
            新值: column.columnHeader.height,
            rowSpan: column.columnHeader.rowSpan,
        });

        // 直接更新内部元素的高度，因为这些元素直接包含textField或staticText，而不是通过elements数组
        // 检查并更新reportElement的高度
        if (column.columnHeader.reportElement) {
            column.columnHeader.reportElement.height = columnHeaderHeight;
        } else if (column.columnHeader.element) {
            // 更新内部元素的height属性，确保设计区域渲染同步更新
            column.columnHeader.element.height = columnHeaderHeight;
        }

        // 如果是合并列，更新高度为行高乘以行跨度
        if (column.columnHeader.rowSpan && column.columnHeader.rowSpan > 1) {
            const mergedHeight = columnHeaderHeight * column.columnHeader.rowSpan;
            console.log("合并列columnHeader高度计算:", {
                行高: columnHeaderHeight,
                rowSpan: column.columnHeader.rowSpan,
                mergedHeight,
            });
            column.columnHeader.height = mergedHeight;

            // 内部元素高度也需要相应调整
            if (column.columnHeader.reportElement) {
                column.columnHeader.reportElement.height = mergedHeight;
            } else if (column.columnHeader.element) {
                column.columnHeader.element.height = mergedHeight;
            }
        }
    }

    if (column.detailCell) {
        // 更新detailCell本身的高度
        column.detailCell.height = tableRowHeights.value.detailCell;
        console.log("更新detailCell高度:", tableRowHeights.value.detailCell, "列:", column);
        // 直接更新内部元素的高度，因为detailCell直接包含textField或staticText，而不是通过elements数组
        // 检查并更新reportElement的高度
        if (column.detailCell.reportElement) {
            column.detailCell.reportElement.height =
                tableRowHeights.value.detailCell;
        } else if (column.detailCell.element) {
            // 更新内部元素的height属性，确保设计区域渲染同步更新
            column.detailCell.element.height = tableRowHeights.value.detailCell;
        }
    }

    // 更新columnFooter的高度
    if (column.columnFooter) {
        // 更新columnFooter本身的高度
        const columnFooterHeight = tableRowHeights.value.columnFooter;
        column.columnFooter.height = columnFooterHeight;

        // 直接更新内部元素的高度，因为这些元素直接包含textField或staticText，而不是通过elements数组
        // 检查并更新reportElement的高度
        if (column.columnFooter.reportElement) {
            column.columnFooter.reportElement.height = columnFooterHeight;
        } else if (column.columnFooter.element) {
            // 更新内部元素的height属性，确保设计区域渲染同步更新
            column.columnFooter.element.height = columnFooterHeight;
        }

        // 如果是合并列，更新高度为行高乘以行跨度
        if (column.columnFooter.rowSpan && column.columnFooter.rowSpan > 1) {
            const mergedHeight =
                columnFooterHeight * column.columnFooter.rowSpan;
            column.columnFooter.height = mergedHeight;

            // 内部元素高度也需要相应调整
            if (column.columnFooter.reportElement) {
                column.columnFooter.reportElement.height = mergedHeight;
            } else if (column.columnFooter.element) {
                column.columnFooter.element.height = mergedHeight;
            }
        }
    }

    // 更新tableFooter的高度
    if (column.tableFooter) {
        // 更新tableFooter本身的高度
        const tableFooterHeight = tableRowHeights.value.tableFooter;
        column.tableFooter.height = tableFooterHeight;

        // 直接更新内部元素的高度，因为这些元素直接包含textField或staticText，而不是通过elements数组
        // 检查并更新reportElement的高度
        if (column.tableFooter.reportElement) {
            column.tableFooter.reportElement.height = tableFooterHeight;
        } else if (column.tableFooter.element) {
            // 更新内部元素的height属性，确保设计区域渲染同步更新
            column.tableFooter.element.height = tableFooterHeight;
        }

        // 如果是合并列，更新高度为行高乘以行跨度
        if (column.tableFooter.rowSpan && column.tableFooter.rowSpan > 1) {
            const mergedHeight = tableFooterHeight * column.tableFooter.rowSpan;
            column.tableFooter.height = mergedHeight;

            // 内部元素高度也需要相应调整
            if (column.tableFooter.reportElement) {
                column.tableFooter.reportElement.height = mergedHeight;
            } else if (column.tableFooter.element) {
                column.tableFooter.element.height = mergedHeight;
            }
        }
    }
}

// 更新组合列的表头高度，确保与组合列高度一致
function updateGroupHeaderHeights(group: any) {
    // 获取组合列的高度
    const groupHeight = group.height;

    console.log("开始更新组合列表头高度:", {
        groupName: group.name,
        groupHeight,
        hasTableHeader: !!group.tableHeader,
        hasColumnHeader: !!group.columnHeader,
    });

    // 更新分组的tableHeader高度
    if (group.tableHeader) {
        // 更新tableHeader本身的高度
        group.tableHeader.height = groupHeight;

        // 直接更新内部元素的高度，因为这些元素直接包含textField或staticText，而不是通过elements数组
        // 检查并更新reportElement的高度
        if (group.tableHeader.reportElement) {
            group.tableHeader.reportElement.height = groupHeight;
        } else if (group.tableHeader.element) {
            // 更新内部元素的height属性，确保设计区域渲染同步更新
            group.tableHeader.element.height = groupHeight;
        }
        console.log("更新后的tableHeader:", group.tableHeader);
    }

    // 更新分组的columnHeader高度
    if (group.columnHeader) {
        // 更新columnHeader本身的高度
        group.columnHeader.height = groupHeight;

        // 直接更新内部元素的高度，因为这些元素直接包含textField或staticText，而不是通过elements数组
        // 检查并更新reportElement的高度
        if (group.columnHeader.reportElement) {
            group.columnHeader.reportElement.height = groupHeight;
        } else if (group.columnHeader.element) {
            // 更新内部元素的height属性，确保设计区域渲染同步更新
            group.columnHeader.element.height = groupHeight;
        }
        console.log("更新后的columnHeader:", group.columnHeader);
    }

    console.log("组合列表头高度更新完成，更新后的组合列:", group);
}

// 递归更新分组的行高
function updateGroupRowHeights(group: any) {
    // 更新分组的tableHeader高度
    if (group.tableHeader) {
        // 更新tableHeader本身的高度
        const tableHeaderHeight = tableRowHeights.value.tableHeader;
        group.tableHeader.height = tableHeaderHeight;

        // 直接更新内部元素的高度，因为这些元素直接包含textField或staticText，而不是通过elements数组
        // 检查并更新reportElement的高度
        if (group.tableHeader.reportElement) {
            group.tableHeader.reportElement.height = tableHeaderHeight;
        } else if (group.tableHeader.element) {
            // 更新内部元素的height属性，确保设计区域渲染同步更新
            group.tableHeader.element.height = tableHeaderHeight;
        }
        console.log("更新后的tableHeader:", group.tableHeader);

        // 如果是合并列，更新高度为行高乘以行跨度
        if (group.tableHeader.rowSpan && group.tableHeader.rowSpan > 1) {
            const mergedHeight = tableHeaderHeight * group.tableHeader.rowSpan;
            group.tableHeader.height = mergedHeight;

            // 内部元素高度也需要相应调整
            if (group.tableHeader.reportElement) {
                group.tableHeader.reportElement.height = mergedHeight;
            } else if (group.tableHeader.element) {
                group.tableHeader.element.height = mergedHeight;
            }
        }
    }

    // 更新分组的columnHeader高度
    if (group.columnHeader) {
        // 更新columnHeader本身的高度
        const columnHeaderHeight = tableRowHeights.value.columnHeader;
        group.columnHeader.height = columnHeaderHeight;

        // 直接更新内部元素的高度，因为这些元素直接包含textField或staticText，而不是通过elements数组
        // 检查并更新reportElement的高度
        if (group.columnHeader.reportElement) {
            group.columnHeader.reportElement.height = columnHeaderHeight;
        } else if (group.columnHeader.element) {
            // 更新内部元素的height属性，确保设计区域渲染同步更新
            group.columnHeader.element.height = columnHeaderHeight;
        }

        // 如果是合并列，更新高度为行高乘以行跨度
        if (group.columnHeader.rowSpan && group.columnHeader.rowSpan > 1) {
            const mergedHeight =
                columnHeaderHeight * group.columnHeader.rowSpan;
            group.columnHeader.height = mergedHeight;

            // 内部元素高度也需要相应调整
            if (group.columnHeader.reportElement) {
                group.columnHeader.reportElement.height = mergedHeight;
            } else if (group.columnHeader.element) {
                group.columnHeader.element.height = mergedHeight;
            }
        }
    }

    // 更新分组的columnFooter高度
    if (group.columnFooter) {
        // 更新columnFooter本身的高度
        const columnFooterHeight = tableRowHeights.value.columnFooter;
        group.columnFooter.height = columnFooterHeight;

        // 直接更新内部元素的高度，因为这些元素直接包含textField或staticText，而不是通过elements数组
        // 检查并更新reportElement的高度
        if (group.columnFooter.reportElement) {
            group.columnFooter.reportElement.height = columnFooterHeight;
        } else if (group.columnFooter.element) {
            // 更新内部元素的height属性，确保设计区域渲染同步更新
            group.columnFooter.element.height = columnFooterHeight;
        }

        // 如果是合并列，更新高度为行高乘以行跨度
        if (group.columnFooter.rowSpan && group.columnFooter.rowSpan > 1) {
            const mergedHeight =
                columnFooterHeight * group.columnFooter.rowSpan;
            group.columnFooter.height = mergedHeight;

            // 内部元素高度也需要相应调整
            if (group.columnFooter.reportElement) {
                group.columnFooter.reportElement.height = mergedHeight;
            } else if (group.columnFooter.element) {
                group.columnFooter.element.height = mergedHeight;
            }
        }
    }

    // 更新分组的tableFooter高度
    if (group.tableFooter) {
        // 更新tableFooter本身的高度
        const tableFooterHeight = tableRowHeights.value.tableFooter;
        group.tableFooter.height = tableFooterHeight;

        // 直接更新内部元素的高度，因为这些元素直接包含textField或staticText，而不是通过elements数组
        // 检查并更新reportElement的高度
        if (group.tableFooter.reportElement) {
            group.tableFooter.reportElement.height = tableFooterHeight;
        } else if (group.tableFooter.element) {
            // 更新内部元素的height属性，确保设计区域渲染同步更新
            group.tableFooter.element.height = tableFooterHeight;
        }

        // 如果是合并列，更新高度为行高乘以行跨度
        if (group.tableFooter.rowSpan && group.tableFooter.rowSpan > 1) {
            const mergedHeight = tableFooterHeight * group.tableFooter.rowSpan;
            group.tableFooter.height = mergedHeight;

            // 内部元素高度也需要相应调整
            if (group.tableFooter.reportElement) {
                group.tableFooter.reportElement.height = mergedHeight;
            } else if (group.tableFooter.element) {
                group.tableFooter.element.height = mergedHeight;
            }
        }
    }

    // 递归更新子分组或列
    if (group.children) {
        console.log("分组内子项数量:", group.children.length);
        group.children.forEach((child: any, index: number) => {
            console.log(`处理子项[${index}]:`, {
                name: child.name,
                uuid: child.uuid,
                hasDetailCell: !!child.detailCell,
                hasChildren: !!child.children,
                childType: child.children ? 'group' : 'column'
            });
            if (child.children) {
                // 子分组
                updateGroupRowHeights(child);
            } else {
                // 普通列
                updateColumnRowHeights(child);
            }
        });
    }
}

// 矩形边框样式计算属性
const rectangleBorderStyle = computed({
    get: () => {
        return getRectangleBorderStyle();
    },
    set: (value) => {
        setRectangleBorderStyle(value);
    },
});

// 获取Band显示名称
function getBandDisplayName(bandType: string): string {
    // Use t() with dynamic key.
    // Assuming keys exist in bandNames section of locale files.
    return t(`bandNames.${bandType}`);
}

// 更新Band高度
function updateBandHeight(_index: number) {
    const updatedBands = [...props.bands];
    emit("save-state");
    emit("update:bands", updatedBands);
    emit("update-jrxml");
}

// 确保坐标值为整数
function ensureIntegerValue(element: any, property: string) {
    if (element[property] !== undefined) {
        element[property] = Math.round(element[property]);
    }
    emit("save-state");
}

// 设置水平对齐方式
function setHorizontalAlignment(alignment: "Left" | "Center" | "Right") {
    if (currentElement.value) {
        emit("save-state");
        currentElement.value.textAlignment = alignment;
        emit("update-jrxml");
    }
}

// 设置垂直对齐方式
function setVerticalAlignment(alignment: "Top" | "Middle" | "Bottom") {
    if (currentElement.value) {
        emit("save-state");
        currentElement.value.verticalAlignment = alignment;
        emit("update-jrxml");
    }
}

// 获取文本字段的表达式
function getTextFieldExpression(element: any) {
    if (element.expression) {
        return element.expression;
    } else if (element.fieldName) {
        return `$F{${element.fieldName}}`;
    }
    return "";
}

// 更新文本字段的表达式
function updateTextFieldExpression(newExpression: string) {
    if (!currentElement.value || currentElement.value.type !== "textField")
        return;

    emit("save-state");
    currentElement.value.expression = newExpression;

    emit("update-jrxml");
}

// 各边边框属性访问函数
function getSideBorderWidth(side: string): number {
    if (!currentElement.value?.box) return 0;
    const box = currentElement.value.box;
    const penKey = `${side}Pen`;
    const widthKey = `${side}BorderWidth`;
    if (box[widthKey] !== undefined) return box[widthKey];
    if (box[penKey]?.lineWidth !== undefined) return box[penKey].lineWidth;
    // Fallback to global pen
    if (box.pen?.lineWidth !== undefined) return box.pen.lineWidth;
    return 0;
}

function setSideBorderWidth(side: string, value: string) {
    if (!currentElement.value?.box) return;
    const numValue = parseFloat(value) || 0;
    const widthKey = `${side}BorderWidth`;
    const penKey = `${side}Pen`;
    emit("save-state");
    currentElement.value.box[widthKey] = numValue;
    if (!currentElement.value.box[penKey]) {
        currentElement.value.box[penKey] = {};
    }
    currentElement.value.box[penKey].lineWidth = numValue;
    emit("update-jrxml");
}

function getSideBorderStyle(side: string): string {
    if (!currentElement.value?.box) return "";
    const box = currentElement.value.box;
    const penKey = `${side}Pen`;
    const styleKey = `${side}BorderStyle`;
    if (box[styleKey] !== undefined) return box[styleKey];
    if (box[penKey]?.lineStyle !== undefined) return box[penKey].lineStyle;
    // Fallback to global pen
    if (box.pen?.lineStyle !== undefined) return box.pen.lineStyle;
    return "";
}

function setSideBorderStyle(side: string, value: string) {
    if (!currentElement.value?.box) return;
    const box = currentElement.value.box;
    const styleKey = `${side}BorderStyle`;
    const penKey = `${side}Pen`;
    emit("save-state");

    // 设置边框样式
    box[styleKey] = value;
    if (!box[penKey]) {
        box[penKey] = {};
    }
    box[penKey].lineStyle = value;

    // 根据样式自动调整边框宽度
    if (value && value !== "") {
        // 非"无"样式，宽度为0则自动设为1
        if (!box[penKey].lineWidth || box[penKey].lineWidth <= 0) {
            box[penKey].lineWidth = 1;
            const widthKey = `${side}BorderWidth`;
            box[widthKey] = 1;
        }
    } else {
        // "无"样式，宽度自动设为0
        box[penKey].lineWidth = 0;
        const widthKey = `${side}BorderWidth`;
        box[widthKey] = 0;
    }

    emit("update-jrxml");
}

function getSideBorderColor(side: string): string {
    if (!currentElement.value?.box) return "#000000";
    const box = currentElement.value.box;
    const penKey = `${side}Pen`;
    const colorKey = `${side}BorderColor`;
    if (box[colorKey] !== undefined) return box[colorKey];
    if (box[penKey]?.lineColor !== undefined) return box[penKey].lineColor;
    // Fallback to global pen
    if (box.pen?.lineColor !== undefined) return box.pen.lineColor;
    return "#000000";
}

function setSideBorderColor(side: string, value: string) {
    if (!currentElement.value?.box) return;
    const box = currentElement.value.box;
    const colorKey = `${side}BorderColor`;
    const penKey = `${side}Pen`;
    emit("save-state");
    box[colorKey] = value;
    if (!box[penKey]) {
        box[penKey] = {};
    }
    box[penKey].lineColor = value;
    emit("update-jrxml");
}

// 四边统一设置相关函数
function getUnifiedBorderStyle(): string {
    if (!currentElement.value?.box) return "";
    // 检查是否所有边的样式都相同
    const sides = ["top", "left", "bottom", "right"];
    const styles = sides.map((side) => getSideBorderStyle(side));
    const firstStyle = styles[0];
    if (styles.every((style) => style === firstStyle)) {
        return firstStyle || "";
    }
    return "";
}

function setUnifiedBorderStyle(value: string) {
    if (!currentElement.value?.box) return;
    emit("save-state");
    const sides = ["top", "left", "bottom", "right"];
    sides.forEach((side) => {
        setSideBorderStyle(side, value);
    });
    emit("update-jrxml");
}

function getUnifiedBorderWidth(): number {
    if (!currentElement.value?.box) return 0;
    // 检查是否所有边的宽度都相同
    const sides = ["top", "left", "bottom", "right"];
    const widths = sides.map((side) => getSideBorderWidth(side));
    const firstWidth = widths[0];
    if (widths.every((width) => width === firstWidth)) {
        return firstWidth || 0;
    }
    return 0;
}

function setUnifiedBorderWidth(value: string) {
    if (!currentElement.value?.box) return;
    const numValue = parseFloat(value) || 0;
    emit("save-state");
    const sides = ["top", "left", "bottom", "right"];
    sides.forEach((side) => {
        setSideBorderWidth(side, value);
    });
    emit("update-jrxml");
}

function getUnifiedBorderColor(): string {
    if (!currentElement.value?.box) return "#000000";
    // 检查是否所有边的颜色都相同
    const sides = ["top", "left", "bottom", "right"];
    const colors = sides.map((side) => getSideBorderColor(side));
    const firstColor = colors[0];
    if (colors.every((color) => color === firstColor)) {
        return firstColor || "#000000";
    }
    return "#000000";
}

function setUnifiedBorderColor(value: string) {
    if (!currentElement.value?.box) return;
    emit("save-state");
    const sides = ["top", "left", "bottom", "right"];
    sides.forEach((side) => {
        setSideBorderColor(side, value);
    });
    emit("update-jrxml");
}

// 初始化表格单元格
function initTableCell(column: any, cellType: "tableFooter" | "columnFooter") {
    if (!column[cellType]) {
        column[cellType] = {
            enable: false,
            element: {
                type: "textField",
                x: 0,
                y: 0,
                width: column.width,
                height: 30,
                expression: "",
                backcolor: "",
                mode: "Transparent",
            },
        };
    }
}

// 更新列宽度，同时更新所有相关单元格的宽度，并重新计算表格总宽度
function updateColumnWidth(column: any, index: number) {
    if (!column || !currentElement) return;

    const newWidth = column.width;

    // 更新所有相关单元格的宽度
    if (column.tableHeader) {
        if (column.tableHeader.element) {
            column.tableHeader.element.width = newWidth;
        } else {
            column.tableHeader.width = newWidth;
        }
    }
    if (column.columnHeader) {
        if (column.columnHeader.element) {
            column.columnHeader.element.width = newWidth;
        } else {
            column.columnHeader.width = newWidth;
        }
    }
    if (column.detailCell) {
        if (column.detailCell.element) {
            column.detailCell.element.width = newWidth;
        } else {
            column.detailCell.width = newWidth;
        }
    }
    if (column.columnFooter) {
        if (column.columnFooter.element) {
            column.columnFooter.element.width = newWidth;
        } else {
            column.columnFooter.width = newWidth;
        }
    }
    if (column.tableFooter) {
        if (column.tableFooter.element) {
            column.tableFooter.element.width = newWidth;
        } else {
            column.tableFooter.width = newWidth;
        }
    }

    // 如果表格有children属性，同时更新children属性中对应列的宽度
    if (
        currentElement.value &&
        currentElement.value.type === "table" &&
        currentElement.value.children
    ) {
        // 查找children中对应的列（通过uuid或索引）
        const childColumn = findColumnInChildren(
            currentElement.value.children,
            column,
        );
        if (childColumn) {
            // 更新childColumn的宽度
            childColumn.width = newWidth;

            // 同时更新childColumn中所有相关单元格的宽度
            if (childColumn.tableHeader) {
                if (childColumn.tableHeader.element) {
                    childColumn.tableHeader.element.width = newWidth;
                } else {
                    childColumn.tableHeader.width = newWidth;
                }
            }
            if (childColumn.columnHeader) {
                if (childColumn.columnHeader.element) {
                    childColumn.columnHeader.element.width = newWidth;
                } else {
                    childColumn.columnHeader.width = newWidth;
                }
            }
            if (childColumn.detailCell) {
                if (childColumn.detailCell.element) {
                    childColumn.detailCell.element.width = newWidth;
                } else {
                    childColumn.detailCell.width = newWidth;
                }
            }
            if (childColumn.columnFooter) {
                if (childColumn.columnFooter.element) {
                    childColumn.columnFooter.element.width = newWidth;
                } else {
                    childColumn.columnFooter.width = newWidth;
                }
            }
            if (childColumn.tableFooter) {
                if (childColumn.tableFooter.element) {
                    childColumn.tableFooter.element.width = newWidth;
                } else {
                    childColumn.tableFooter.width = newWidth;
                }
            }
        }
    }

    // 重新计算表格总宽度：所有列宽度之和
    if (
        currentElement.value &&
        currentElement.value.type === "table" &&
        currentElement.value.columns
    ) {
        const totalWidth = currentElement.value.columns.reduce(
            (sum: number, col: any) => sum + (col.width || 0),
            0,
        );
        currentElement.value.width = totalWidth;
    }
}

// 在children数组中查找对应的列（递归查找）
function findColumnInChildren(children: any[], targetColumn: any): any | null {
    for (const child of children) {
        if (child.uuid === targetColumn.uuid) {
            return child;
        }
        if (child.children) {
            const found = findColumnInChildren(child.children, targetColumn);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

// 更新列名，同时更新children属性中对应列的名称
function updateColumnName(column: any, index: number) {
    if (!column || !currentElement) return;

    const newName = column.name;

    // 如果表格有children属性，同时更新children属性中对应列的名称
    if (
        currentElement.value &&
        currentElement.value.type === "table" &&
        currentElement.value.children
    ) {
        // 查找children中对应的列（通过uuid或索引）
        const childColumn = findColumnInChildren(
            currentElement.value.children,
            column,
        );
        if (childColumn) {
            // 更新childColumn的名称
            childColumn.name = newName;

            // 如果childColumn有columnHeader且是staticText类型，同时更新其文本内容
            if (
                childColumn.columnHeader &&
                childColumn.columnHeader.type === "staticText"
            ) {
                childColumn.columnHeader.text = newName;
            }
        }
    }
}

// 更新表格表头文本，同时更新children属性中对应列的表格表头文本
function updateTableHeaderText(column: any, index: number) {
    if (
        !column ||
        !currentElement ||
        !column.hasTableHeader ||
        !column.tableHeader
    )
        return;

    const newText = column.tableHeader.text;

    // 如果表格有children属性，同时更新children属性中对应列的表格表头文本
    if (
        currentElement.value &&
        currentElement.value.type === "table" &&
        currentElement.value.children
    ) {
        // 查找children中对应的列（通过uuid或索引）
        const childColumn = findColumnInChildren(
            currentElement.value.children,
            column,
        );
        if (
            childColumn &&
            childColumn.hasTableHeader &&
            childColumn.tableHeader
        ) {
            // 更新childColumn的表格表头文本
            childColumn.tableHeader.text = newText;
        }
    }
}

// 更新字段表达式，同时更新children属性中对应列的字段表达式
function updateFieldExpression(column: any, index: number) {
    if (!column || !currentElement || !column.detailCell) return;

    const newExpression = column.detailCell.expression;

    // 如果detailCell是staticText类型，将其转换为textField类型
    if (column.detailCell.type === "staticText") {
        // 保存原有属性
        const {
            x,
            y,
            width,
            height,
            textAlignment,
            verticalAlignment,
            fontSize,
            isBold,
            isItalic,
            isUnderline,
            fontFamily,
            backcolor,
            mode,
            box,
        } = column.detailCell;
        // 转换为textField类型
        column.detailCell = {
            type: "textField",
            x,
            y,
            width,
            height,
            expression: newExpression,
            textAlignment,
            verticalAlignment,
            fontSize,
            isBold,
            isItalic,
            isUnderline,
            fontFamily,
            backcolor,
            mode,
            box,
            textAdjust: "CutText",
            isBlankWhenNull: true,
        };
    }

    // 如果表格有children属性，同时更新children属性中对应列的字段表达式
    if (
        currentElement.value &&
        currentElement.value.type === "table" &&
        currentElement.value.children
    ) {
        // 查找children中对应的列（通过uuid或索引）
        const childColumn = findColumnInChildren(
            currentElement.value.children,
            column,
        );
        if (childColumn && childColumn.detailCell) {
            // 如果childColumn的detailCell是staticText类型，将其转换为textField类型
            if (childColumn.detailCell.type === "staticText") {
                // 保存原有属性
                const {
                    x,
                    y,
                    width,
                    height,
                    textAlignment,
                    verticalAlignment,
                    fontSize,
                    isBold,
                    isItalic,
                    isUnderline,
                    fontFamily,
                    backcolor,
                    mode,
                    box,
                } = childColumn.detailCell;
                // 转换为textField类型
                childColumn.detailCell = {
                    type: "textField",
                    x,
                    y,
                    width,
                    height,
                    expression: newExpression,
                    textAlignment,
                    verticalAlignment,
                    fontSize,
                    isBold,
                    isItalic,
                    isUnderline,
                    fontFamily,
                    backcolor,
                    mode,
                    box,
                    textAdjust: "CutText",
                    isBlankWhenNull: true,
                };
            } else {
                // 更新childColumn的字段表达式
                childColumn.detailCell.expression = newExpression;
            }
        }
    }
}

// 切换是否包含Table Header
function toggleTableHeader(column: any, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const hasTableHeader = checkbox.checked;

    if (!hasTableHeader) {
        // 清空已有的Table Header数据
        delete column.tableHeader;
    } else {
        // 生成新的默认Table Header数据
        if (!column.tableHeader) {
            column.tableHeader = {
                type: "staticText",
                x: 0,
                y: 0,
                width: column.width,
                height: 30,
                text: column.name,
                forecolor: "#000000",
                backcolor: "#FFFFFF",
                fontFamily: "SansSerif",
                fontSize: 19,
                isBold: true,
                textAlignment: "Center",
                verticalAlignment: "Middle",
            };
        }
    }

    emit("update-jrxml");
}

// 字段选择模态框相关
const showFieldSelectionModal = ref(false);
const selectedFields = ref<string[]>([]);
const availableFields = computed(() => {
    if (
        !currentElement.value ||
        currentElement.value.type !== "table" ||
        !props.subDatasets
    )
        return [];

    const tableElement = currentElement.value as any;
    const datasetName = tableElement.dataset?.name;

    if (!datasetName) return [];

    // 在subDatasets中查找匹配的数据集
    const matchingDataset = props.subDatasets.find(
        (dataset) => dataset.name === datasetName,
    );
    return matchingDataset?.fields || [];
});

// 计算属性：获取所有组合列，包括子级组，返回扁平化的列表
const allColumnGroups = computed(() => {
    if (
        !currentElement.value ||
        currentElement.value.type !== "table" ||
        !currentElement.value.children
    ) {
        return [];
    }
    return getAllColumnGroups(currentElement.value.children);
});

// 打开字段选择模态框
function openFieldSelectionModal() {
    if (!currentElement.value || currentElement.value.type !== "table") return;

    // Reset selected fields
    selectedFields.value = [];

    // Get current table columns
    const tableElement = currentElement.value as any;
    if (tableElement.columns) {
        // Extract field names from existing columns
        const usedFieldNames = tableElement.columns
            .map((column: any) => {
                if (column.detailCell?.expression) {
                    // Match field expression pattern like $F{fieldName}
                    const match =
                        column.detailCell.expression.match(/\$F\{([^}]+)\}/);
                    return match ? match[1] : null;
                }
                return null;
            })
            .filter((fieldName: string | null) => fieldName !== null);

        // Set selected fields to used field names
        selectedFields.value = usedFieldNames as string[];
    }

    showFieldSelectionModal.value = true;
}

// 切换字段选择状态
function toggleFieldSelection(fieldName: string) {
    const index = selectedFields.value.indexOf(fieldName);
    if (index === -1) {
        selectedFields.value.push(fieldName);
    } else {
        selectedFields.value.splice(index, 1);
    }
}

// 将选中的字段添加为列
function addSelectedFieldsAsColumns() {
    if (!currentElement.value || currentElement.value.type !== "table") return;

    emit("save-state");

    const columnWidth = 160;
    const tableElement = currentElement.value as any;

    // Ensure columns array exists
    if (!tableElement.columns) {
        tableElement.columns = [];
    }

    // Get existing columns and their field names
    const existingColumns = [...tableElement.columns];
    const existingFieldMap = new Map<string, any>();

    // Populate existing field map
    existingColumns.forEach((column) => {
        if (column.detailCell?.element?.expression) {
            const match =
                column.detailCell.element.expression.match(/\$F\{([^}]+)\}/);
            if (match) {
                const fieldName = match[1];
                existingFieldMap.set(fieldName, column);
            }
        }
    });

    // Prepare new columns array
    const newColumns: any[] = [];

    // Add columns for selected fields
    selectedFields.value.forEach((fieldName) => {
        // Check if field already has a column
        if (existingFieldMap.has(fieldName)) {
            // Keep existing column
            newColumns.push(existingFieldMap.get(fieldName));
            // Remove from map to track which fields are still used
            existingFieldMap.delete(fieldName);
        } else {
            // Create new column for new field
            const newColumn: any = {
                uuid: crypto.randomUUID(),
                width: columnWidth,
                name: fieldName,
                hasTableHeader: false,
                tableHeader: {
                    enable: false,
                    element: {
                        type: "staticText",
                        x: 0,
                        y: 0,
                        width: columnWidth,
                        height: 30,
                        text: fieldName,
                        forecolor: "#000000",
                        backcolor: "#FFFFFF",
                        fontFamily: "SansSerif",
                        fontSize: 19,
                        isBold: true,
                    },
                },
                columnHeader: {
                    enable: true,
                    element: {
                        type: "staticText",
                        x: 0,
                        y: 0,
                        width: columnWidth,
                        height: 30,
                        text: fieldName,
                    },
                },
                detailCell: {
                    enable: true,
                    element: {
                        type: "textField",
                        x: 0,
                        y: 0,
                        width: columnWidth,
                        height: 30,
                        expression: `$F{${fieldName}}`,
                    },
                },
                columnFooter: {
                    enable: false,
                    element: {
                        type: "textField",
                        x: 0,
                        y: 0,
                        width: columnWidth,
                        height: 30,
                        expression: "",
                    },
                },
                tableFooter: {
                    enable: false,
                    element: {
                        type: "textField",
                        x: 0,
                        y: 0,
                        width: columnWidth,
                        height: 30,
                        expression: "",
                    },
                },
            };

            newColumns.push(newColumn);
        }
    });

    // Update table columns
    tableElement.columns = newColumns;

    showFieldSelectionModal.value = false;
    selectedFields.value = [];
    emit("update-jrxml");
}

// 表格列操作方法
function addTableColumn() {
    if (!currentElement.value || currentElement.value.type !== "table") return;

    emit("save-state");

    const columnWidth = 160;
    const newColumn: any = {
        uuid: crypto.randomUUID(),
        width: columnWidth,
        name: `Column${currentElement.value.columns.length + 1}`,
        hasTableHeader: false,
        tableHeader: {
            enable: false,
            element: {
                type: "empty",
                x: 0,
                y: 0,
                width: columnWidth,
                height: 30,
            },
        },
        columnHeader: {
            enable: true,
            element: {
                type: "empty",
                x: 0,
                y: 0,
                width: columnWidth,
                height: 30,
            },
        },
        detailCell: {
            enable: true,
            element: {
                type: "empty",
                x: 0,
                y: 0,
                width: columnWidth,
                height: 30,
            },
        },
        tableFooter: {
            enable: false,
            element: {
                type: "empty",
                x: 0,
                y: 0,
                width: columnWidth,
                height: 30,
            },
        },
        columnFooter: {
            enable: false,
            element: {
                type: "empty",
                x: 0,
                y: 0,
                width: columnWidth,
                height: 30,
            },
        },
    };

    if (!currentElement.value.columns) {
        currentElement.value.columns = [];
    }

    currentElement.value.columns.push(newColumn);

    // 重新计算表格总宽度：所有列宽度之和
    const totalWidth = currentElement.value.columns.reduce(
        (sum: number, col: any) => sum + (col.width || 0),
        0,
    );
    currentElement.value.width = totalWidth;

    emit("update-jrxml");
}

// 添加列分组
function addColumnGroup() {
    if (
        !currentElement.value ||
        currentElement.value.type !== "table" ||
        !props.selectedElement
    )
        return;

    const { elementIndex, bandIndex, parentFrameIndex } = props.selectedElement;
    // 修复TypeScript错误：使用正确的参数格式
    emit("add-columns-to-group", {
        elementIndex,
        columnIndices: [],
        bandIndex,
        parentFrameIndex,
    });
}

function removeTableColumn(index: number) {
    if (
        !currentElement.value ||
        currentElement.value.type !== "table" ||
        !currentElement.value.columns
    )
        return;

    if (currentElement.value.columns.length <= 1) {
        // 至少保留一列
        return;
    }

    emit("save-state");
    currentElement.value.columns.splice(index, 1);

    // 重新计算表格总宽度：所有列宽度之和
    const totalWidth = currentElement.value.columns.reduce(
        (sum: number, col: any) => sum + (col.width || 0),
        0,
    );
    currentElement.value.width = totalWidth;

    emit("update-jrxml");
}

// 获取所有组合列，包括子级组，返回扁平化的列表
function getAllColumnGroups(groups: any[]): any[] {
    const result: any[] = [];

    function traverse(group: any, path: number[] = []) {
        // 直接修改原始对象，添加path属性
        group.path = path;
        result.push(group);
        if (group.children && group.children.length > 0) {
            group.children.forEach((child: any, index: number) => {
                traverse(child, [...path, index]);
            });
        }
    }

    groups.forEach((group) => traverse(group));
    return result;
}

// 计算组合列的最大允许宽度（所有子列和子组合列宽度之和）
function calculateMaxGroupWidth(groupInfo: any): number {
    // 递归计算所有叶子节点（普通列）的宽度之和
    function calculateLeafColumnsWidth(node: any): number {
        // 如果节点有children，递归计算所有子节点
        if (node.children && node.children.length > 0) {
            return node.children.reduce((sum: number, child: any) => {
                return sum + calculateLeafColumnsWidth(child);
            }, 0);
        }
        // 如果节点没有children，说明是普通列，返回其宽度
        return node.width || 0;
    }

    return calculateLeafColumnsWidth(groupInfo);
}

// 删除元素
function deleteElement() {
    emit("delete-element");
}

// 矩形边框相关辅助函数
function getRectangleBorderWidth(): number {
    const el = currentElement.value as any;
    if (!el?.pen) return 1;
    return el.pen.lineWidth || 0;
}

function setRectangleBorderWidth(value: string) {
    if (!currentElement.value) return;
    const el = currentElement.value as any;
    const numValue = parseFloat(value) || 0;
    emit("save-state");
    if (!el.pen) {
        el.pen = {};
    }
    el.pen.lineWidth = numValue;
    emit("update-jrxml");
}

function getRectangleBorderStyle(): string {
    const el = currentElement.value as any;
    if (!el?.pen) return "Solid";
    return el.pen.lineStyle || "Solid";
}

function setRectangleBorderStyle(value: string) {
    if (!currentElement.value) return;
    const el = currentElement.value as any;
    emit("save-state");
    if (!el.pen) {
        el.pen = {};
    }
    el.pen.lineStyle = value;
    emit("update-jrxml");
}

function getRectangleBorderColor(): string {
    const el = currentElement.value as any;
    if (!el?.pen) return "#000000";
    return el.pen.lineColor || "#000000";
}

function setRectangleBorderColor(value: string) {
    if (!currentElement.value) return;
    const el = currentElement.value as any;
    emit("save-state");
    if (!el.pen) {
        el.pen = {};
    }
    el.pen.lineColor = value;
    emit("update-jrxml");
}

// 获取表格中第一个出现的指定类型的单元格样式
function getFirstTableCellStyle(
    cellType: "tableHeader" | "columnHeader" | "columnFooter" | "detailCell",
) {
    const tableElement = currentElement.value;
    if (!tableElement || tableElement.type !== "table")
        return {
            textAlignment: "Center",
            verticalAlignment: "Middle",
            fontSize: 12,
            isBold: false,
            isItalic: false,
            isUnderline: false,
            forecolor: "#000000",
            forecolorMode: "Opaque",
            backcolor: "#ffffff",
            mode: "Opaque",
        };

    // 递归查找函数
    function findCellStyle(node: any): any {
        if (node[cellType]) {
            return node[cellType];
        }
        if (node.children) {
            for (const child of node.children) {
                const style = findCellStyle(child);
                if (style) {
                    return style;
                }
            }
        }
        return null;
    }

    // 首先检查直接子列
    if (tableElement.columns) {
        for (const column of tableElement.columns) {
            const style = findCellStyle(column);
            if (style) {
                return style;
            }
        }
    }

    // 然后检查列分组
    if (tableElement.children) {
        for (const group of tableElement.children) {
            const style = findCellStyle(group);
            if (style) {
                return style;
            }
        }
    }

    // 如果没有找到样式，返回默认样式
    return {
        textAlignment: "Center",
        verticalAlignment: "Middle",
        fontSize: 12,
        isBold: false,
        isItalic: false,
        isUnderline: false,
        forecolor: "#000000",
        forecolorMode: "Opaque",
        backcolor: "#ffffff",
        mode: "Opaque",
    };
}

// 更新表格中所有指定类型的单元格样式
function updateAllTableCellStyles(
    cellType: "tableHeader" | "columnHeader" | "columnFooter" | "detailCell",
    style: any,
) {
    const tableElement = currentElement.value;
    if (!tableElement || tableElement.type !== "table") return;

    // 递归更新函数
    function updateCellStyle(node: any) {
        if (node[cellType]) {
            // 深拷贝样式对象，避免引用问题
            node[cellType] = { ...style };
        }
        if (node.children) {
            for (const child of node.children) {
                updateCellStyle(child);
            }
        }
    }

    // 更新所有直接子列
    if (tableElement.columns) {
        for (const column of tableElement.columns) {
            updateCellStyle(column);
        }
    }

    // 更新所有列分组
    if (tableElement.children) {
        for (const group of tableElement.children) {
            updateCellStyle(group);
        }
    }
}

// 更新表格所有单元格的样式属性
function updateTableStyles() {
    const tableElement = currentElement.value;
    if (!tableElement || tableElement.type !== "table") return;

    // 递归更新函数
    function updateCellStyle(node: any) {
        // 更新tableHeader样式
        if (node.tableHeader) {
            node.tableHeader.style = tableStyles.value.tableHeader;
        }
        // 更新columnHeader样式
        if (node.columnHeader) {
            node.columnHeader.style = tableStyles.value.columnHeader;
        }
        // 更新columnFooter样式
        if (node.columnFooter) {
            node.columnFooter.style = tableStyles.value.columnFooter;
        }
        // 更新detailCell样式
        if (node.detailCell) {
            node.detailCell.style = tableStyles.value.detailCell;
        }
        // 递归更新子节点
        if (node.children) {
            for (const child of node.children) {
                updateCellStyle(child);
            }
        }
    }

    // 更新所有直接子列
    if (tableElement.columns) {
        for (const column of tableElement.columns) {
            updateCellStyle(column);
        }
    }

    // 更新所有列分组
    if (tableElement.children) {
        for (const group of tableElement.children) {
            updateCellStyle(group);
        }
    }
}

// 排序字段管理
function addSortField() {
    if (!currentElement.value || currentElement.value.type !== "sort") return;
    if (!currentElement.value.sortFields) {
        currentElement.value.sortFields = [];
    }
    currentElement.value.sortFields.push({
        name: "",
        order: "Ascending",
    });
    emit("update-jrxml");
}

function removeSortField(index: number) {
    if (!currentElement.value || currentElement.value.type !== "sort") return;
    if (!currentElement.value.sortFields) return;
    currentElement.value.sortFields.splice(index, 1);
    emit("update-jrxml");
}

// 列表内容高度
const listContentsHeight = ref(0);
const listContentsWidth = ref(0);

// 同步列表内容高度到currentElement
watch(
    () => currentElement.value,
    (el) => {
        if (el && el.type === "list" && el.listContents) {
            listContentsHeight.value = el.listContents.height || 0;
            listContentsWidth.value = el.listContents.width || 0;
        }
    },
    { immediate: true },
);

function updateListContentsHeight() {
    if (!currentElement.value || currentElement.value.type !== "list") return;
    if (!currentElement.value.listContents) {
        currentElement.value.listContents = {
            elements: [],
            height: 0,
            width: 0,
        };
    }
    currentElement.value.listContents.height = listContentsHeight.value;
    emit("update-jrxml");
}

function updateListContentsWidth() {
    if (!currentElement.value || currentElement.value.type !== "list") return;
    if (!currentElement.value.listContents) {
        currentElement.value.listContents = {
            elements: [],
            height: 0,
            width: 0,
        };
    }
    currentElement.value.listContents.width = listContentsWidth.value;
    emit("update-jrxml");
}
</script>

<style scoped>
.element-properties {
    padding: var(--prop-spacing-md);
}

.element-properties h3 {
    margin: 0 0 var(--prop-spacing-md) 0;
    padding: 0 0 var(--prop-spacing-xs) 0;
    font-size: var(--prop-font-size-md);
    font-weight: var(--prop-font-weight-semibold);
    color: var(--prop-text-primary);
    border-bottom: 1px solid var(--prop-divider-color);
}

.element-properties h4 {
    margin: 0 0 var(--prop-spacing-md) 0;
    padding: 0;
    font-size: var(--prop-font-size-md);
    font-weight: var(--prop-font-weight-semibold);
    color: var(--prop-text-primary);
}

.element-properties h5 {
    margin: 0 0 var(--prop-spacing-sm) 0;
    padding: 0;
    font-size: var(--prop-font-size-sm);
    font-weight: var(--prop-font-weight-semibold);
    color: var(--prop-text-secondary);
}

.property-section {
    margin-bottom: var(--prop-spacing-lg);
}

.form-group {
    margin-bottom: var(--prop-spacing-sm);
}

.form-group-row {
    display: flex;
    gap: var(--prop-spacing-sm);
    margin-bottom: var(--prop-spacing-sm);
}

.half-width {
    flex: 1;
}

.basic-properties-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--prop-spacing-md);
    margin-bottom: var(--prop-spacing-lg);
}

.basic-properties-grid .form-group {
    margin-bottom: 0;
}

.form-group label {
    display: block;
    margin-bottom: var(--prop-spacing-xs);
    font-size: var(--prop-font-size-sm);
    font-weight: var(--prop-font-weight-medium);
    color: var(--prop-text-secondary);
}

.form-group input:not([type="checkbox"]),
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--prop-border-color);
    border-radius: var(--prop-border-radius-md);
    font-size: var(--prop-font-size-sm);
    box-sizing: border-box;
    transition:
        border-color var(--prop-transition-fast),
        box-shadow var(--prop-transition-fast);
}

.form-group input[type="checkbox"] {
    padding: 6px 8px;
    border: 1px solid var(--prop-border-color);
    border-radius: var(--prop-border-radius-md);
    font-size: var(--prop-font-size-sm);
    box-sizing: border-box;
}

.form-group input:hover,
.form-group select:hover,
.form-group textarea:hover {
    border-color: var(--prop-border-hover);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--prop-border-focus);
    box-shadow: var(--prop-focus-ring);
}

.form-group textarea {
    min-height: 80px;
    resize: vertical;
}

.form-group small {
    display: block;
    margin-top: 4px;
    font-size: 10px;
    color: #999;
}

.band-heights-grid {
    display: grid;
    gap: var(--prop-spacing-sm);
}

.band-height-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.band-height-control {
    display: flex;
    align-items: center;
    gap: var(--prop-spacing-xs);
}

.band-height-input {
    width: 80px;
}

.band-height-unit {
    font-size: var(--prop-font-size-sm);
    color: var(--prop-text-tertiary);
}

.box-section {
    margin-bottom: var(--prop-spacing-lg);
    padding: var(--prop-spacing-md);
    background-color: var(--prop-bg-secondary);
    border-radius: var(--prop-border-radius-md);
}

.box-section.compact {
    margin-bottom: var(--prop-spacing-md);
    padding: var(--prop-spacing-sm);
}

.border-quick-actions {
    display: flex;
    gap: var(--prop-spacing-sm);
}

.border-quick-actions.compact {
    gap: var(--prop-spacing-xs);
}

.border-group-row {
    display: flex;
    gap: var(--prop-spacing-md);
    flex-wrap: wrap;
    align-items: flex-start;
}

.border-group-item {
    flex: 1;
    min-width: 120px;
}

.border-sides-grid {
    display: grid;
    gap: var(--prop-spacing-sm);
}

.border-side-item {
    display: flex;
    align-items: flex-start;
    gap: var(--prop-spacing-sm);
}

.border-side-controls {
    flex: 1;
    display: flex;
    gap: var(--prop-spacing-sm);
    align-items: center;
    flex-wrap: wrap;
}

.border-side-group {
    display: flex;
    align-items: center;
    gap: var(--prop-spacing-sm);
    margin-bottom: var(--prop-spacing-sm);
    flex-wrap: wrap;
}

.side-label {
    width: 20px;
    font-size: var(--prop-font-size-sm);
    font-weight: var(--prop-font-weight-medium);
    color: var(--prop-text-secondary);
}

.side-control {
    flex: 1;
    min-width: 100px;
}

.side-control.compact {
    min-width: 80px;
    height: 24px;
    padding: 2px 6px;
    font-size: 11px;
}

.width-control {
    width: 80px;
}

.width-control.compact {
    width: 50px;
    height: 24px;
    padding: 2px 6px;
    font-size: 11px;
}

.color-control {
    width: 60px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--prop-border-color);
    border-radius: var(--prop-border-radius-md);
    cursor: pointer;
}

.color-control.compact {
    width: 40px;
    height: 24px;
}

.form-group.compact {
    margin-bottom: var(--prop-spacing-sm);
}

.form-group.compact label {
    font-size: 11px;
    margin-bottom: 2px;
}

.form-group.compact input {
    height: 24px;
    padding: 2px 6px;
    font-size: 11px;
}

.small-input {
    width: 100%;
    height: 24px;
    padding: 2px 6px;
    font-size: 11px;
    box-sizing: border-box;
}

.padding-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--prop-spacing-sm);
}

.padding-grid.compact {
    gap: var(--prop-spacing-sm);
}

.border-quick-styles {
    margin-top: var(--prop-spacing-md);
    padding-top: var(--prop-spacing-md);
    border-top: 1px solid var(--prop-divider-color);
}

.border-quick-styles h6 {
    margin: 0 0 var(--prop-spacing-sm) 0;
    font-size: var(--prop-font-size-xs);
    font-weight: var(--prop-font-weight-semibold);
    color: var(--prop-text-secondary);
}

.quick-style-buttons {
    display: flex;
    gap: var(--prop-spacing-sm);
    flex-wrap: wrap;
}

.quick-style-buttons .n-button {
    margin: 0;
}

/* 调整radio按钮组的样式，使其更紧凑 */
:deep(.n-radio-group--button-type) {
    flex-wrap: wrap;
    gap: 4px;
}

:deep(.n-radio-button) {
    height: 24px;
    font-size: 11px;
    padding: 0 8px;
}

:deep(.n-radio-button__input) {
    margin: 0;
}

.checkbox-group {
    display: flex;
    gap: var(--prop-spacing-lg);
    margin-bottom: var(--prop-spacing-lg);
}

.checkbox-group.compact {
    gap: var(--prop-spacing-sm);
    margin-bottom: var(--prop-spacing-sm);
    flex-wrap: wrap;
}

.checkbox-group label {
    display: flex;
    align-items: center;
    gap: var(--prop-spacing-xs);
    font-size: var(--prop-font-size-sm);
    cursor: pointer;
}

.alignment-controls.compact {
    margin-bottom: 0;
}

.checkbox-group input[type="checkbox"] {
    width: auto;
}

.alignment-controls {
    display: flex;
    gap: var(--prop-spacing-xs);
    margin-bottom: var(--prop-spacing-sm);
}

.element-actions {
    margin-top: var(--prop-spacing-xl);
    padding-top: var(--prop-spacing-lg);
    border-top: 1px solid var(--prop-divider-color);
}

.font-hint {
    display: block;
    margin-top: var(--prop-spacing-xs);
    font-size: var(--prop-font-size-xs);
    color: var(--prop-text-tertiary);
}

/* 表格属性样式 */
.table-column-actions {
    display: flex;
    gap: var(--prop-spacing-xs);
    margin-bottom: var(--prop-spacing-sm);
}

.form-group.small {
    flex: 1;
    min-width: 80px;
    margin-bottom: var(--prop-spacing-xs);
}

.form-group.small.full-width {
    width: 100%;
    flex-basis: 100%;
    margin-top: 2px;
}

.form-group.small label {
    margin-bottom: 1px;
    font-size: var(--prop-font-size-xs);
}

.small-input {
    width: 100%;
    padding: 2px 6px;
    font-size: var(--prop-font-size-xs);
    border: 1px solid var(--prop-border-color);
    border-radius: var(--prop-border-radius-sm);
    transition:
        border-color var(--prop-transition-fast),
        box-shadow var(--prop-transition-fast);
}

.small-input:hover {
    border-color: var(--prop-border-hover);
}

.small-input:focus {
    outline: none;
    border-color: var(--prop-border-focus);
    box-shadow: var(--prop-focus-ring);
}

.text-style-controls,
.border-controls {
    display: flex;
    gap: var(--prop-spacing-xs);
    flex-wrap: wrap;
}

.color-picker {
    height: 18px;
    padding: 0;
    border: 1px solid var(--prop-border-color);
    border-radius: var(--prop-border-radius-sm);
    cursor: pointer;
}

.field-selection-content {
    display: flex;
    gap: var(--prop-spacing-xl);
    height: 400px;
}

.available-fields,
.selected-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.inline-checkbox {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
}

.inline-checkbox input {
    margin-right: 5px;
}

.inline-input {
    display: flex;
    align-items: center;
    margin-top: 5px;
}

.inline-input label {
    margin-right: 5px;
    min-width: 70px;
}

.available-fields h4,
.selected-fields h4 {
    margin-top: 0;
    margin-bottom: var(--prop-spacing-md);
    font-size: var(--prop-font-size-md);
    font-weight: var(--prop-font-weight-semibold);
    color: var(--prop-text-secondary);
}

.fields-list {
    flex: 1;
    overflow-y: auto;
    border: 1px solid var(--prop-border-color);
    border-radius: var(--prop-border-radius-md);
    background-color: var(--prop-bg-secondary);
    padding: var(--prop-spacing-sm);
}

.field-item {
    display: flex;
    align-items: center;
    padding: var(--prop-spacing-sm) var(--prop-spacing-md);
    margin-bottom: var(--prop-spacing-xs);
    background-color: var(--prop-bg-primary);
    border: 1px solid var(--prop-border-color);
    border-radius: var(--prop-border-radius-md);
    cursor: pointer;
    transition: all var(--prop-transition-fast);
}

.field-item:hover {
    background-color: var(--prop-bg-tertiary);
    border-color: var(--prop-primary-color);
}

.field-item.selected {
    background-color: #e6f7ff;
    border-color: #91d5ff;
}

.field-item input[type="checkbox"] {
    margin-right: var(--prop-spacing-sm);
}

/* 无效宽度样式 */
.invalid-width {
    border-color: var(--prop-danger-color) !important;
    background-color: #fff0f0;
}

/* 只读输入框样式 */
.readonly-input {
    display: block;
    padding: 2px 6px;
    font-size: var(--prop-font-size-xs);
    border: 1px solid var(--prop-border-color);
    border-radius: var(--prop-border-radius-sm);
    background-color: var(--prop-bg-disabled);
    color: var(--prop-text-secondary);
    cursor: default;
}

/* 宽度提示样式 */
.width-hint {
    font-size: var(--prop-font-size-xs);
    color: var(--prop-text-tertiary);
    margin-top: 2px;
}

.field-name {
    flex: 1;
    font-size: var(--prop-font-size-sm);
    font-weight: var(--prop-font-weight-medium);
}

.field-type {
    font-size: 11px;
    color: var(--prop-text-tertiary);
    margin-left: var(--prop-spacing-sm);
}

/* 组合列样式 */
.table-column-groups {
    margin-top: var(--prop-spacing-md);
    background-color: var(--prop-bg-secondary);
    border-radius: var(--prop-border-radius-md);
    padding: var(--prop-spacing-md);
    border: 1px solid var(--prop-border-color);
}

.column-group-item {
    margin-bottom: 15px;
    background-color: var(--prop-bg-primary);
    border: 1px solid var(--prop-border-color);
    border-radius: var(--prop-border-radius-md);
    overflow: hidden;
    box-shadow: var(--prop-shadow-sm);
}

.column-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--prop-spacing-md);
    background-color: var(--prop-bg-tertiary);
    border-bottom: 1px solid var(--prop-border-color);
    font-weight: var(--prop-font-weight-semibold);
    color: var(--prop-text-primary);
}

.column-group-name {
    font-size: var(--prop-font-size-md);
    display: flex;
    align-items: center;
    gap: var(--prop-spacing-sm);
}

.group-path {
    font-size: var(--prop-font-size-sm);
    color: var(--prop-text-secondary);
    font-weight: normal;
    background-color: #e6f0fa;
    padding: 2px 6px;
    border-radius: 10px;
}

.column-group-properties {
    padding: var(--prop-spacing-md);
}

.group-action-buttons {
    display: flex;
    gap: var(--prop-spacing-xs);
}

.table-style-settings {
    display: flex;
    flex-direction: column;
    gap: var(--prop-spacing-lg);
}

.table-style-section {
    margin-bottom: var(--prop-spacing-md);
}

.table-style-section h6 {
    margin-bottom: var(--prop-spacing-sm);
    font-size: var(--prop-font-size-sm);
    font-weight: var(--prop-font-weight-medium);
    color: var(--prop-text-primary);
}

/* 样式管理部分 */
.style-management-section {
    margin-bottom: var(--prop-spacing-lg);
}

.style-manager-content {
    max-height: 500px;
    overflow-y: auto;
}

.style-item {
    margin-bottom: var(--prop-spacing-xl);
    padding: var(--prop-spacing-lg);
    border: 1px solid var(--prop-border-color);
    border-radius: var(--prop-border-radius-md);
    background-color: var(--prop-bg-secondary);
}

.style-item h4 {
    margin-top: 0;
    margin-bottom: var(--prop-spacing-md);
    font-size: var(--prop-font-size-md);
    font-weight: var(--prop-font-weight-semibold);
    color: var(--prop-text-primary);
    border-bottom: 1px solid var(--prop-border-color);
    padding-bottom: var(--prop-spacing-sm);
}

.style-properties {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--prop-spacing-lg);
}

@media (max-width: 768px) {
    .style-properties {
        grid-template-columns: 1fr;
    }
}
</style>
