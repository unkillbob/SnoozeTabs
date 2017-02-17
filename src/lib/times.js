/* exported timeForId */

import moment from 'moment';
import 'moment/min/locales.min';
moment.locale(browser.i18n.getUILanguage());

const NEXT_OPEN = 'next';
const PICK_TIME = 'pick';
export {NEXT_OPEN, PICK_TIME};

export const times = [
  {id: 'later', icon: 'later_today.svg', title: browser.i18n.getMessage('timeLaterToday')},
  {id: 'tomorrow', icon: 'tomorrow.svg', title: browser.i18n.getMessage('timeTomorrow')},
  {id: 'weekend', icon: 'weekends.svg', title: browser.i18n.getMessage('timeThisWeekend')},
  {id: 'week', icon: 'next_week.svg', title: browser.i18n.getMessage('timeNextWeek')},
  {id: 'month', icon: 'next_month.svg', title: browser.i18n.getMessage('timeNextMonth')},
  {id: NEXT_OPEN, icon: 'next_open.svg', title: browser.i18n.getMessage('timeNextOpen')},
  {id: PICK_TIME, icon: 'pick_date.svg', title: browser.i18n.getMessage('timePickADate')},
];

if (process.env.NODE_ENV === 'development') {
  times.unshift({ id: 'debug', icon: 'nightly.svg', title: browser.i18n.getMessage('timeRealSoonNow')});
}

export function timeForId(time, id) {
  let rv = moment(time);
  let text = rv.fromNow();
  const twelveHour = ']h[';
  const twentyFourHour = ']H[';
  const minutes = ']mm[';
  const ampm = ']a[';
  const shortDay = ']ddd[';
  const shortMonth = ']MMM[';
  const dayOfMonth = ']D[';
  const times = [twelveHour, twentyFourHour, minutes, ampm,
    shortDay, shortMonth, dayOfMonth];
  let message;
  switch (id) {
    case 'debug':
      rv = rv.add(5, 'seconds');
      message = 'formatJustTime';
      break;
    case 'later':
      rv = rv.add(3, 'hours').minute(0);
      message = 'formatJustTime';
      break;
    case 'tomorrow':
      rv = rv.add(1, 'day').hour(9).minute(0);
      message = 'formatDayTime';
      break;
    case 'weekend':
      rv = rv.day(6).hour(9).minute(0);
      message = 'formatDayTime';
      break;
    case 'week':
      rv = rv.add(1, 'week').hour(9).minute(0);
      message = 'formatFullDate';
      break;
    case 'month':
      rv = rv.add(1, 'month').hour(9).minute(0);
      message = 'formatFullDate';
      break;
    case NEXT_OPEN:
      rv = NEXT_OPEN;
      text = '';
      break;
    case PICK_TIME:
      rv = null;
      text = '';
      break;
    default:
      break;
  }
  if (message) {
    message = browser.i18n.getMessage(message, times);
    console.log(message); // eslint-disable-line no-console
    text = rv.format(`[${message}]`);
  }
  return [rv, text];
}

export function confirmationTime(time, timeType) {
  if (timeType === NEXT_OPEN) {
    return browser.i18n.getMessage('timeUpcomingNextOpen');
  }

  let rv;
  const endOfDay = moment().endOf('day');
  const endOfTomorrow = moment().add(1, 'day').endOf('day');
  const upcoming = moment(time);
  let timeStr = ']h';
  if (upcoming.minutes()) {
    timeStr += ':mm';
  }
  timeStr += 'a[';
  const weekday = ']ddd[';
  const month = ']MMM[';
  const date = ']D[';
  if (upcoming.isBefore(endOfDay)) {
    rv = `[${browser.i18n.getMessage('timeUpcomingToday', timeStr)}]`;
  } else if (upcoming.isBefore(endOfTomorrow)) {
    rv = `[${browser.i18n.getMessage('timeUpcomingTomorrow', timeStr)}]`;
  } else {
    rv = `[${browser.i18n.getMessage('timeUpcomingLater', [weekday, month, date, timeStr])}]`;
  }
  return upcoming.format(rv);
}
