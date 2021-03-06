import "./App.css";
import logo from "./logo.png";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import {
  Button,
  Input,
  AutoComplete,
  Table,
  Pagination,
  Tag,
  Notification,
  Loading,
  Message,
} from "element-react";
import copy from "copy-to-clipboard";
import axios from "axios";

import "element-theme-default";

class App extends Component {
  constructor(props) {
    super(props);
    this.copyText = (data) => {
      try {
        copy(data.requestUri);
        Notification({
          title: "成功",
          message: "复制成功",
          type: "success",
          duration: 1000,
        });
      } catch (error) {
        console.error(error);
        Notification({
          title: "失败",
          message: "复制失败",
          type: "error",
          duration: 1000,
        });
      }
    };
    this.openUrl = (data) => {
      window.open(data.swaggerUrl, "_blank");
    };
    this.formatKeyword = (value) => {
      let val = value;
      let rp = <span className="rp">{this.state.keyword}</span>;
      let tempUriArr = val
        .replaceAll(this.state.keyword, `##${this.state.keyword}##`)
        .split("##");
      let allElement = tempUriArr.map((item) =>
        item == this.state.keyword ? rp : item
      );
      if (val.indexOf(this.state.keyword) !== -1) {
        return <span>{allElement}</span>;
      } else {
        return val;
      }
    };
    this.state = {
      columns: [
        {
          label: "微服务",
          prop: "app",
          width: 200,
          render: function (data) {
            return <Tag>{data.app}</Tag>;
          },
        },
        {
          label: "方法",
          prop: "requestMethod",
          width: 100,
        },
        {
          label: "接口地址",
          prop: "requestUri",
          minWidth: 300,
          render: (data) => {
            return this.formatKeyword(data.requestUri);
          },
        },
        {
          // summary || description
          label: "描述",
          prop: "summary",
          width: 300,
          render: (data) => {
            return this.formatKeyword(data.summary || data.description);
          },
        },
        {
          label: "操作",
          prop: "requestUri",
          minWidth: 280,
          render: (data) => {
            return (
              <span>
                <Button
                  plain={false}
                  type="info"
                  size="small"
                  onClick={this.openUrl.bind(this, data)}
                >
                  打开 swagger
                </Button>
                <Button
                  type="success"
                  size="small"
                  icon="document"
                  onClick={this.copyText.bind(this, data)}
                >
                  复制接口地址
                </Button>
              </span>
            );
          },
        },
      ],
      list: [],
      loading: false,
      keyword: "",
      pageNum: 0,
      total: 0,
    };
  }

  componentDidMount() {}

  showLoading() {
    this.setState({
      loading: true,
    });
  }

  hideLoading() {
    this.setState({
      loading: false,
    });
  }

  validParams() {
    if (this.state.keyword.length > 2) {
      return true;
    }
    return false;
  }

  search(e) {
    const { type, code } = e;
    if ("keydown" == type && "Enter" != code) {
      return;
    }
    if (this.validParams()) {
      this.resetQueryParam().then(() => {
        this.queryList(this.state.pageNum + 1, 20);
      });
    } else {
      Message.error("搜索的内容长度需要大于2");
    }
  }

  resetQueryParam() {
    return new Promise((resolve, reject) => {
      this.setState(
        {
          list: [],
          pageNum: 0,
          total: 0,
          loading: false,
        },
        () => {
          resolve();
        }
      );
    });
  }

  queryList(pageNum = 1, pageSize = 20) {
    this.showLoading();
    axios
      .get(
        `http://10.10.3.88:15522/eureka/api_list?keyword=${this.state.keyword}&pageNum=${pageNum}&pageSize=${pageSize}`,
        { timeout: 5000 }
      )
      .then((response) => {
        this.processResult(response);
      })
      .catch((error) => {
        console.log(error);
        Message.error("查询失败");
      })
      .then(() => {
        // finally
        this.hideLoading();
      });
  }

  processResult(response) {
    const { status, data = {} } = response;
    if (status === 200) {
      const { code, data: apiData = {}, message = "" } = data;
      if (code === 0) {
        const { list, pageNum, pages, size, total } = apiData;
        this.setState({
          list: [...list],
          pageNum: pageNum,
          pages: pages,
          size: size,
          total: total,
        });
      } else {
        Message.error(`服务器异常[${message}]`);
      }
    } else {
      Message.error("网络异常");
    }
  }

  onChange(val) {
    this.setState({
      keyword: val,
    });
  }

  onPageChange() {}

  render() {
    return (
      <div className="appRoot">
        <div className="content">
          <div>
            <h3 className="tip">
              <img src={logo} className="App-logo" alt="logo" />
              搜索内容是基于&nbsp;
              <a href="http://10.10.3.63:1111/" target="_blank">
                eureka
              </a>
              &nbsp;可能会存在更新不及时的情况。
            </h3>
          </div>
          <div className="App">
            <Input
              placeholder="请输入接口地址或者接口描述（长度大于2）"
              value={this.state.keyword}
              onChange={this.onChange.bind(this)}
              onKeyDown={this.search.bind(this)}
              append={
                <Button
                  type="primary"
                  icon="search"
                  onClick={this.search.bind(this)}
                >
                  搜索
                </Button>
              }
            />
            <Loading loading={this.state.loading} text="拼命加载中...">
              <Table
                className="table"
                columns={this.state.columns}
                data={this.state.list}
                stripe={true}
              />
            </Loading>
            {!this.state.loading && (
              <Pagination
                className="pagination"
                layout="total, prev, pager, next"
                total={this.state.total}
                currentPage={this.state.pageNum}
                onCurrentChange={this.onPageChange.bind(this)}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
