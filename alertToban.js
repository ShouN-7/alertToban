function checkToban(){
  // sheetId
  const id = "1vRJmegHHP7DxxfW4OViCDMomQs-ya3aqYPX34cA8Zgw";
  // 日時関連データは複数メソッドで参照されるのでGlobal変数に設定
  today = new Date();
  dayOfWeek = today.getDay();
  year = today.getFullYear();
  month = today.getMonth() + 1;
  
  // 平日は処理続行
  if(!checkHolidayToday()){
    // スプレッドシート取得
    sheet = SpreadsheetApp.openById(id);
    
    // カレンダーシートのシート名（"年/月"）
    var strYM = year + "/" + month;
    // カレンダーシート取得
    calenderSheet = sheet.getSheetByName(strYM);
    
    // 電話当番取得
    var callStaff = getTodaysCallStaff();
    
    // Slack電話当番表示テキストを生成
    var slack_result = month + "月" + today.getDate() + "日の当番\n :phone: ";
    for(var j = 0; j < callStaff.length; j++){
      if(j == callStaff.length-1){
        slack_result += callStaff[j] + "\n";
      }else{
        slack_result += callStaff[j] + "・";
      }
    }
    
    // コーヒー清掃取得
    var coffeeStaff = getTodaysCoffeeStaff();
    
    // コーヒー絵文字
    slack_result += " :coffee: ";
    // コーヒー配列は要素が2つ以上の場合、製氷機清掃もある日
    if(coffeeStaff.length > 1){
      for(var j = 0; j < coffeeStaff.length; j++){
        if(j == callStaff.length-1){
          slack_result += " :shaved_ice: " + coffeeStaff[j] + "\n";
        }else{
          slack_result += coffeeStaff[j] + "\n";
        }
      }
    }else{
      slack_result += coffeeStaff[0] + "\n";
    }
    
    // Slackに送信
    sendSlack(slack_result);  
  }else{
    // 休日なら処理終了
    return;
  }
}

/***************************************
 * 休日チェック
 ***************************************/
function checkHolidayToday(){
  // 休日判定
  if(dayOfWeek <= 0 || 6 <= dayOfWeek){
    return true;
  }
  // 祝日判定
  var calendarId = "ja.japanese#holiday@group.v.calendar.google.com";
  var calendar = CalendarApp.getCalendarById(calendarId);
  var todayEvents = calendar.getEventsForDay(today);
  if(todayEvents.length > 0){
    return true;
  }
  // 平日
  return false;
}

/***************************************
 * 電話当番チェック
 ***************************************/
function getTodaysCallStaff(){
  // カレンダーシート内の電話当番表周辺マージン
  var xMargin = 2; // 縦マージン（曜日表示含）
  var yMargin = 1; // 横マージン
  
  // 今日の電話担当者を取得
  var aryCallStaffStr = getAryStaffString(xMargin, yMargin);
  
  // 今日の電話担当者を返す
  return aryCallStaffStr;
}

/***************************************
 * コーヒー当番のチェック
 ***************************************/
function getTodaysCoffeeStaff(){
  // カレンダーシート内の電話当番表周辺マージン
  var xMargin = 16; // 縦マージン（曜日表示含）
  var yMargin = 1; // 横マージン
  
  // 今日のコーヒー担当者取得
  var aryCoffeeStaffStr = getAryStaffString(xMargin, yMargin);
  
  // 今日のコーヒー担当者を返す
  return aryCoffeeStaffStr;
}

/*******************************************
 * カレンダーシートから今日の担当者番号を取得
 * 担当者シートから担当者番号に対応した担当者名を取得
 * 担当者名配列を返す
 *******************************************/
function getAryStaffString(xMargin, yMargin){
  // 月の第何週か算出
  var weekOfMonth = Math.floor(( today.getDate() - dayOfWeek + 12 ) / 7 );
  // 値を取得する列、行の設定
  var row = xMargin + weekOfMonth * 2;
  var column = yMargin + dayOfWeek;
  
  // カレンダーシートからセルを取得
  var range = calenderSheet.getRange(row, column);
  // セルの値を取得
  var staffNums = range.getValue();
  // 取得した値を配列に整形
  var aryStaffNum = new Array();
  // 文字列サイズが2より大きい場合は担当者が複数いる
  if(staffNums.length > 2){
    aryStaffNum = staffNums.split(",");
  }else{
    aryStaffNum[0] = staffNums;
  }
  
  // 担当者シートを取得
  var staffSheet = sheet.getSheetByName("担当者");
  // 担当者番号に対応した担当者名を取得して配列に格納
  var aryStaffStr = new Array();
  for(var i = 0; i < aryStaffNum.length; i++){
    var num = Number(aryStaffNum[i]);
    var range = staffSheet.getRange(1 + num, 3);
    var value = range.getValue();
    aryStaffStr[i] = value; 
  }
  
  // 担当者名配列を返す
  return aryStaffStr;
}
  
/***************************************
 * Slackに投稿
 ***************************************/
function sendSlack(message)
{
  // slack関連設定
  // incomng webhookのPostUrl [2017年ワークスペース,2018年ワークスペース]
  var postUrl = ["https://hooks.slack.com/services/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","https://hooks.slack.com/services/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"]; 
  var postChannel = "#general"; // Channel
  var username = '当番アナウンス君'; // ユーザー名(表示名)
  var icon = ':thinking_face:';
  
  var jsonData =
  {
     "channel" : postChannel,
     "username" : username,
    "icon_emoji" : icon,
     "text" : message
  };
  
  // jsデータをJSONに整形
  var payload = JSON.stringify(jsonData);
  
  // オプション設定
  var options =
  {
    "method" : "post",
    "contentType" : "application/json",
    "payload" : payload
  };
  
  // SlackにPost
  for(var i = 0; i < postUrl.length; i++){
    UrlFetchApp.fetch(postUrl[i], options);
  }
}
  
 /*******************************************
 * カレンダーシートから今日の担当者を取得
 * 担当者シートを使わない版
 * ※改良版（未使用）
 *******************************************/
function getAryStaff(xMargin, yMargin){
  // 月の第何週か算出
  var weekOfMonth = Math.floor(( today.getDate() - dayOfWeek + 12 ) / 7 );
  // 値を取得する列、行の設定
  var row = xMargin + weekOfMonth * 2;
  var column = yMargin + dayOfWeek;
  
  // カレンダーシートからセルを取得
  var range = calenderSheet.getRange(row, column);
  // セルの値を取得
  var staffStr = range.getValue();
  // 取得した値を配列に整形
  var aryStaffStr = new Array();
  /* 担当者が複数いる場合は文字列内に"・"が含まれる
  * 含んでいない場合は-1が返ってくる               */
  if(staffStr.indexOf("・") !== -1){
    aryStaffStr = staffStr.split("・");
  }else{
    aryStaffStr[0] = staffStr;
  }
  // 担当者名配列を返す
  return aryStaffStr;
}
