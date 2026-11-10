export default class ReqHttp {
    protected static post(url, params, sCb, fCb = null, type: ContentType = ContentType.FORM) {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': type
            },
            body: type === ContentType.FORM ? new URLSearchParams(params).toString() : JSON.stringify(params)
        })
       .then(response => {
            if (response.ok) {
                response.json().then(data => {
                    sCb && sCb(data);
                })
            } else {
                fCb && fCb();
            }
        })
       .catch(error => {
            fCb && fCb();
            ERROR("POST ERROR");
            ERROR(error);
        })
    }

    protected static get(url, params, sCb, fCb = null) {
        fetch(url + this.analyzeParams(params))
       .then(response => {
            if (response.ok) {
                response.json().then(data => {
                    sCb && sCb(data);
                })
            } else {
                fCb && fCb();
            }
        })
       .catch(error => {
            fCb && fCb();
            ERROR("GET ERROR");
            ERROR(error);
        })
    }

    protected static file(url, params, sCb, fCb = null) {
        fetch(url + this.analyzeParams(params))
       .then(response => {
            if (response.ok) {
                response.text().then(data => {
                    sCb && sCb(data);
                })
            } else {
                fCb && fCb();
            }
        })
       .catch(error => {
            fCb && fCb();
            ERROR("FILE ERROR");
            ERROR(error);
        })
    }

    /**拼接参数列表 */
    private static analyzeParams(params): string {
        if (Object.keys(params).length == 0)
            return "";
        let analyzeStr: string = "?";
        Object.keys(params).forEach((key, index) => {
            if (index > 0) analyzeStr += '&'
            analyzeStr = analyzeStr + key + "=" + params[key];
        })
        return analyzeStr;
    }
}

enum ContentType {
    JSON = 'application/json',
    FORM = 'application/x-www-form-urlencoded'
}
