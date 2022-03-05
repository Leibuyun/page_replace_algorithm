<template>
  <div id="app">
    <el-button type="danger" style="float: right" @click="showChartsClick()"
      >查看图表</el-button
    >
    <el-button type="primary" style="float: right" @click="btnClick()"
      >模拟算法</el-button
    >
    <h2>{{ showCharts ? "页面置换算法图表" : "页面置换算法模拟实现" }}</h2>
    <el-input
      placeholder="请输入访问串（空格分隔）"
      v-model="accessOrderValue"
      @change="initData"
      clearable
    >
    </el-input>
    <div v-show="!showCharts">
      <el-input
        placeholder="请输入页面大小"
        @change="initData"
        v-model.number="pageSize"
        type="number"
        min="1"
        max="9"
        style="width: 150px"
      >
      </el-input>
      <el-select
        v-model="algorithmValue"
        placeholder="请选择算法"
        @change="initData"
      >
        <el-option
          v-for="item in algorithmOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        >
        </el-option>
      </el-select>
      <el-input
        placeholder="请输入动画间隔时间（ms）"
        v-model.number="sleepTime"
        type="number"
        min="300"
        step="100"
        clearable
        style="width: 220px"
      >
      </el-input>
      <p v-show="showPercent" class="result">
        {{ algorithmValue }}算法的<span class="strong">缺页次数</span>:
        {{ cnt }}次, <span class="strong">缺页率</span>为:
        {{ results[algorithmValue] | formatPercent }}
      </p>
      <!-- <el-button type="primary" style="float: right" @click="executeAlgorithm()" -->
      <el-table
        ref="showTable"
        :data="tableData"
        id="showTable"
        :header-cell-style="{ background: '#eef1f6', color: '#606266' }"
        :cell-style="cellStyle"
      >
        <el-table-column label="时刻" type="index" width="64"></el-table-column>
        <el-table-column label="P" prop="order">
          <!-- eslint-disable-next-line -->
          <template slot-scope="scope" slot="header">
            <el-tooltip
              content="程序访问的页面号）"
              placement="top"
              effect="dark"
            >
              <span>P</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="M">
          <!-- eslint-disable-next-line -->
          <template slot-scope="scope" slot="header">
            <el-tooltip content="在主存的页面号" placement="left" effect="dark">
              <span>M</span>
            </el-tooltip>
          </template>
          <template v-for="index of pageSize">
            <el-table-column
              :key="index"
              :label="'' + index"
              :width="columnWidth()"
              :prop="'page' + index"
            ></el-table-column>
          </template>
        </el-table-column>
        <el-table-column label="F" align="center" prop="isbreak">
          <!-- eslint-disable-next-line -->
          <template slot-scope="scope" slot="header">
            <el-tooltip
              content="X: 未发生中断 √: 发生中断"
              placement="right"
              effect="dark"
            >
              <span>是否发生缺页中断</span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-show="showCharts">
      <div id="mainContainer" ref="charts"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "app",
  components: {},
  data() {
    return {
      // 表格数据
      tableData: [],
      // 访问的页面号, 程序访问内存的顺序
      accessOrder: [],
      accessOrderValue: "3 5 1 2 3 1 5 1 2 3 4 1 3 1 5",
      // 页面大小
      pageSize: 3,
      // 内存中已经有的页面
      pageData: [],
      // 选择的算法
      algorithmValue: "FIFO",
      algorithmOptions: [
        { label: "先进先出算法(FIFO)", value: "FIFO" },
        { label: "理想型淘汰算法(OPT)", value: "OPT" },
        { label: "最近最久未使用算法(LRU)", value: "LRU" },
      ],
      // 记录缺页率
      results: {},
      // 记录缺页次数
      cnt: 0,
      // 当前访问的页面的索引号, 0开始
      curIndex: 0,
      // 延迟时间
      sleepTime: 400,
      // 是否显示结果
      showPercent: false,
      // 接收定时器
      timer: "",
      // 是否显示图表
      showCharts: true,
      charts: "",
      option: {
        title: {
          text: "缺页率折线图",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "cross",
          },
        },
        toolbox: {
          feature: {
            saveAsImage: {},
          },
        },
        legend: {
          data: ["FIFO", "OPT", "LRU"],
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: [], // 10, 22, 46.33, 43, 100
            name: "FIFO",
            type: "line",
            smooth: true,
            label: {
              show: false,
              position: "insideBottomRight",
              textStyle: {
                fontSize: 20,
              },
            },
          },
          {
            data: [], // 5, 4, 13.22, 5, 10
            name: "OPT",
            type: "line",
            smooth: true,
            label: {
              show: false,
              position: "insideBottomLeft",
              textStyle: {
                fontSize: 20,
              },
            },
          },
          {
            data: [], // 33.78, 13.35, 22, 79, 19
            name: "LRU",
            type: "line",
            smooth: true,
            label: {
              show: false,
              position: "insideTop",
              textStyle: {
                fontSize: 20,
              },
            },
          },
        ],
      },
    };
  },
  methods: {
    // 计算不同页面数，列宽
    columnWidth() {
      return 888 / this.pageSize;
    },
    // 设置某些单元格的颜色
    cellStyle({ row, column, rowIndex, columnIndex }) {
      if (columnIndex === 1) return "color: skyblue";
      else if (columnIndex === row.breakNum) return "color: red";
      if (row.isbreak !== "X" && column.label === "F") return "color: #01A9D1;";
      else if (column.label === "F") return "color: orange;";
    },
    initData() {
      clearInterval(this.timer);
      this.accessOrder = this.accessOrderValue.trim().split(/\s+/);
      this.curIndex = 0;
      this.cnt = 0;
      this.results = {};
      this.tableData = [];
      this.pageData = [];
      this.showPercent = false;
      this.sleepTime = 400;
    },
    initChart() {
      this.charts = this.$echarts.init(this.$refs.charts, "dark");
      this.charts.setOption(this.option);
    },
    btnClick() {
      // 数据初始化
      this.initData();
      this.showCharts = false;
      // 通过Interval来模拟动画效果, 一行一行加载数据
      this.timer = setInterval(this.executeAlgorithm, this.sleepTime);
    },
    showChartsClick() {
      this.showCharts = true;
      this.accessOrder = this.accessOrderValue.trim().split(/\s+/);
      this.charts.clear();
      this.getFIFO();
      this.getOPT();
      this.getLRU();
      this.initChart();
    },
    // 计算缺页率
    getFIFO() {
      let resultData = [];
      // 计算分配的页面数目从1~9的缺页率
      for (let i = 1; i <= 9; ++i) {
        // cnt记录缺页次数
        let cnt = 0,
          totalLength = this.accessOrder.length;
        let tmpPageData = []; // 存储已经放的页面
        for (let j = 0; j < totalLength; ++j) {
          const curValue = this.accessOrder[j]; // 当前访问的页面号
          let flag = true;
          // 判断是否中断
          for (let k = 0; k < tmpPageData.length; ++k)
            if (curValue === tmpPageData[k]) {
              flag = false;
              break;
            }
          // 如果发生中断，则删除第一个到达的页面
          if (flag) {
            cnt++;
            if (tmpPageData.length === i) tmpPageData.shift();
            tmpPageData.push(curValue);
          }
        }
        let ans = ((cnt / totalLength) * 100).toFixed(2);
        resultData.push(ans);
        console.log(ans);
      }
      this.option.series[0].data = resultData;
    },
    getOPT() {
      let resultData = [];
      // 计算分配的页面数目从1~9的缺页率
      for (let i = 1; i <= 9; ++i) {
        // cnt记录缺页次数
        let cnt = 0,
          totalLength = this.accessOrder.length;
        let tmpPageData = []; // 存储已经放的页面
        for (let j = 0; j < totalLength; ++j) {
          const curValue = this.accessOrder[j]; // 当前访问的页面号
          let flag = true;
          // 判断是否中断
          for (let k = 0; k < tmpPageData.length; ++k) {
            if (curValue === tmpPageData[k]) {
              flag = false;
              break;
            }
          }
          if (flag) {
            cnt++;
            if (tmpPageData.length + 1 <= i) tmpPageData.push(curValue);
            else {
              let arr = new Array(i).fill(0),
                tmpSize = i;
              for (let k = j + 1; k < totalLength; ++k) {
                for (let l = 0; l < tmpPageData.length; ++l) {
                  if (
                    tmpPageData[l] === this.accessOrder[k] &&
                    tmpSize >= 2 &&
                    arr[l] !== 1
                  ) {
                    tmpSize--;
                    arr[k] = 1;
                    break;
                  }
                }
                if (tmpSize === 1) break;
              }
              // 找到需要修改的那一项
              let repIndex = 0;
              for (let k = 0; k < i; ++k) {
                if (arr[k] === 0) {
                  repIndex = k;
                  break;
                }
              }
              tmpPageData[repIndex] = curValue;
            }
          }
        }
        let ans = ((cnt / totalLength) * 100).toFixed(2);
        resultData.push(ans);
      }
      this.option.series[1].data = resultData;
    },
    getLRU() {
      let resultData = [];
      // 计算分配的页面数目从1~9的缺页率
      for (let i = 1; i <= 9; ++i) {
        // cnt记录缺页次数
        let cnt = 0,
          totalLength = this.accessOrder.length;
        let tmpPageData = []; // 存储已经放的页面
        for (let j = 0; j < totalLength; ++j) {
          const curValue = this.accessOrder[j]; // 当前访问的页面号
          let flag = true;
          // 判断是否中断
          for (let k = 0; k < tmpPageData.length; ++k)
            if (curValue === tmpPageData[k]) {
              flag = false;
              break;
            }
          if (flag) {
            cnt++;
            if (tmpPageData.length + 1 <= i) tmpPageData.push(curValue);
            else {
              tmpPageData.shift();
              tmpPageData.push(curValue);
            }
          } else {
            let repIndex = 0;
            for (let k = 0; k < i; ++k){
              if(tmpPageData[k] === curValue){
                repIndex = k;
                break;
              }
            }
            // 将其放至栈顶
            tmpPageData.splice(repIndex, 1);
            tmpPageData.push(curValue);
          }
        }
        let ans = ((cnt / totalLength) * 100).toFixed(2);
        resultData.push(ans);
      }
      this.option.series[2].data = resultData;
    },
    // 动态加载表格数据
    executeAlgorithm() {
      // 当所有串访问完毕，显示结果，取消定时器
      if (this.curIndex >= this.accessOrder.length && this.curIndex !== 0) {
        clearInterval(this.timer);
        this.showPercent = true;
        return;
      }
      let obj = {};
      obj["order"] = this.accessOrder[this.curIndex];
      this.tableData.push(obj);

      const curValue = this.accessOrder[this.curIndex];
      let i = this.curIndex;

      // 判断是否中断
      let flag = true,
        breakNum = -1;
      for (let j = 0; j < this.pageData.length; j++) {
        if (curValue === this.pageData[j]) {
          flag = false;
          break;
        }
      }

      // 算法模拟
      if (this.algorithmValue === "FIFO") {
        // 发生中断
        if (flag) {
          if (i < this.pageSize) breakNum = this.pageData.length;
          else breakNum = 0;
          if (i >= 1) this.tableData[i - 1]["breakNum"] = breakNum + 2; // +2代表在table表中的位置
          // 如果容器还没满，不删除元素。否则删除第一个到达的元素
          if (i >= this.pageSize && this.pageData.length == this.pageSize)
            this.pageData.shift();
          this.pageData.push(curValue);
          this.cnt += 1;
          this.tableData[i]["isbreak"] = "√";
        } else {
          this.tableData[i]["isbreak"] = "X";
        }
      } else if (this.algorithmValue === "OPT") {
        // 如果发生中断
        if (flag) {
          this.tableData[i]["isbreak"] = "√";
          this.cnt += 1;
          // 当未满时，直接添加元素
          if (this.pageData.length + 1 <= this.pageSize) {
            this.pageData.push(curValue);
          } else {
            let tmp = this.pageSize;
            let arr = new Array(tmp).fill(0); // 用来记录哪些不需要替换
            // 从下一项开始遍历
            for (let j = i + 1; j < this.accessOrder.length; ++j) {
              for (let k = 0; k < this.pageSize; ++k) {
                // 如果这一项之后需要访问
                if (
                  this.pageData[k] === this.accessOrder[j] &&
                  arr[k] !== 1 &&
                  tmp >= 2
                ) {
                  tmp--;
                  arr[k] = 1;
                  break;
                }
              }
              if (tmp === 1) break;
            }
            // 找到需要修改的那一项
            let repIndex = 0;
            for (let j = 0; j < this.pageSize; ++j)
              if (arr[j] === 0) {
                repIndex = j;
                break;
              }
            this.pageData[repIndex] = curValue; // 如果权值相同，替换第一项
            if (i >= 1) this.tableData[i - 1]["breakNum"] = repIndex + 2;
          }
        } else {
          this.tableData[i]["isbreak"] = "X";
        }
      } else {
        // 如果发生中断
        if (flag) {
          this.tableData[i]["isbreak"] = "√";
          this.cnt += 1;
          // 未满直接添加元素
          if (this.pageData.length + 1 <= this.pageSize) {
            this.pageData.push(curValue);
          } else {
            // 删除栈底的元素
            this.pageData.shift();
            this.pageData.push(curValue);
          }
        } else {
          let repIndex = 0;
          for (let j = 0; j < this.pageSize; ++j)
            if (this.pageData[j] === curValue) {
              repIndex = j;
              break;
            }
          // 将其防至栈顶
          this.pageData.splice(repIndex, 1);
          this.pageData.push(curValue);
          this.tableData[i]["isbreak"] = "X";
        }
      }
      // 添加新数据
      for (let j = 0; j < this.pageData.length; j++) {
        const tmp = this.pageData[j];
        let attrName = "page" + (j + 1);
        this.tableData[i][attrName] = tmp;
      }
      this.curIndex += 1;
      this.results[this.algorithmValue] = this.cnt / this.accessOrder.length;
    },
  },
  filters: {
    formatPercent(val) {
      return (val * 100).toFixed(2) + "%";
    },
  },
  mounted() {
    this.initChart();
  },
};
</script>

<style>
body {
  margin: 0;
}

/* 设置表格的宽度以及位置 */
#app {
  margin: 0 auto;
  margin-top: 3%;
  width: 80%;
}

/* 设置表格的文字居中 */
#showTable th,
#showTable td {
  text-align: center;
}

.result {
  display: inline;
  color: teal;
}

.strong {
  color: skyblue;
}

/* 图表 */
#mainContainer {
  width: 100%;
  height: 600px;
  margin-top: 50px;
}
</style>
