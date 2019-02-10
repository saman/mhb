var dataFile = './data.json';

Vue.use(Buefy.default, { defaultIconPack: 'fa' })

var app = new Vue({
  el: '#app',
  data: {
    list: {},
    modules: [],
    search: '',
  },
  computed: {
    filteredList() {
      return this.modules.filter(x => {
        if (x.text) {
          return x.text.toLowerCase().includes(this.search.toLowerCase())
        }
        return true;
      })
    }
  },
  created: function () {
    this.runApp();
  },
  methods: {
    toTitleCase: function(str) {
      return str.replace(/\w\S*/g, function(txt){
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    },
    runApp: function () {
      this.$http.get(dataFile).then(apiResponse => {
        this.list = apiResponse.body;
        this.modules = this.list['3'].children;
        this.modules = this.modules.map((x, i) => {
          x.count = false;
          x.text = Object.values(x.items).join(',');
          return x;
        })
      })
    },
  },
  filters: {
    numberFormat: function (value, count = 4) {
      if (!isNaN(parseFloat(value)) && isFinite(value)) {
        const tmp = parseFloat(value).toFixed(count)
        return new Intl.NumberFormat().format(tmp);
      }
      return '-'
    },
    n2b: function (value) {
      if (value) {
        return value.replace(/\n/g, '<br />');
      }
      return value
    }
  }
})