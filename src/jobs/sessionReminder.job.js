import cron from "node-cron";
import { DateTime } from "luxon";

import SessionModel from "../models/session.model.js";
import CaseModel from "../models/case.model.js";
import UserModel from "../models/User.model.js";
import officeModel from "../models/office.model.js";

import createNotification from "../services/notification.service.js";

const TIME_ZONE = "Africa/Cairo";

// تحويل sessionDate + sessionTime إلى موعد الجلسة بتوقيت القاهرة
const getSessionDateTime = (sessionDate, sessionTime) => {
  const date = DateTime.fromJSDate(new Date(sessionDate), { zone: "utc" });

  return DateTime.fromObject(
    {
      year: date.year,
      month: date.month,
      day: date.day,
      hour: Number(sessionTime.split(":")[0]),
      minute: Number(sessionTime.split(":")[1]),
      second: 0,
      millisecond: 0,
    },
    {
      zone: TIME_ZONE,
    },
  );
};

const sendSessionReminder = async (session, reminderType) => {
  try {
    const caseData = await CaseModel.findOne({
      _id: session.caseId,
      officeId: session.officeId,
    });

    if (!caseData) {
      return;
    }

    const usersIds = new Set();

    // صاحب المكتب
    const office = await officeModel.findOne({
      _id: session.officeId,
      isActive: true,
    });

    if (office?.Owner_id) {
      usersIds.add(office.Owner_id.toString());
    }

    // المحامين المسندين للقضية
    if (caseData.lawyers?.length) {
      caseData.lawyers.forEach((lawyerId) => {
        usersIds.add(lawyerId.toString());
      });
    }

    if (!usersIds.size) {
      return;
    }

    const users = await UserModel.find({
      _id: {
        $in: Array.from(usersIds),
      },
      isActive: true,
    });

    let title = "";
    let message = "";

    if (reminderType === "1_day_before") {
      title = "🔔 جلسة غدًا";

      message = `لديك جلسة غدًا للقضية رقم ${caseData.caseNumber} الساعة ${session.sessionTime}`;
    }

    if (reminderType === "1_hour_before") {
      title = "🔔 جلسة بعد ساعة";

      message = `لديك جلسة للقضية رقم ${caseData.caseNumber} بعد ساعة، الساعة ${session.sessionTime}`;
    }

    for (const user of users) {
      try {
        await createNotification({
          officeId: session.officeId,
          userId: user._id,
          type: "upcoming_session",
          reminderType,
          title,
          message,
          caseId: caseData._id,
          sessionId: session._id,
        });
      } catch (error) {
        // منع تكرار نفس الإشعار
        if (error.code === 11000) {
          continue;
        }

        console.error(`Notification Error for user ${user._id}:`, error);
      }
    }
  } catch (error) {
    console.error("Send Session Reminder Error:", error);
  }
};

const checkUpcomingSessions = async () => {
  try {
    const now = DateTime.now().setZone(TIME_ZONE);

    console.log("Current Cairo Time:", now.toFormat("yyyy-MM-dd HH:mm"));

    const sessions = await SessionModel.find({
      status: "scheduled",
    });

    console.log("Scheduled Sessions:", sessions.length);

    for (const session of sessions) {
      const sessionDateTime = getSessionDateTime(
        session.sessionDate,
        session.sessionTime,
      );

      const difference = sessionDateTime.toMillis() - now.toMillis();

      const differenceMinutes = Math.round(difference / (60 * 1000));

      console.log(
        `Session ${session._id} | ${sessionDateTime.toFormat(
          "yyyy-MM-dd HH:mm",
        )} | Difference: ${differenceMinutes} minutes`,
      );

      const oneDay = 24 * 60;
      const oneHour = 60;

      // اختبار إشعار قبل يوم
      if (differenceMinutes >= oneDay - 5 && differenceMinutes <= oneDay + 5) {
        console.log(`Sending 1 day reminder for session ${session._id}`);

        await sendSessionReminder(session, "1_day_before");
      }

      // اختبار إشعار قبل ساعة
      if (
        differenceMinutes >= oneHour - 5 &&
        differenceMinutes <= oneHour + 5
      ) {
        console.log(`Sending 1 hour reminder for session ${session._id}`);

        await sendSessionReminder(session, "1_hour_before");
      }
    }
  } catch (error) {
    console.error("Check Upcoming Sessions Error:", error);
  }
};

// تشغيل الـ Job كل 5 دقائق
cron.schedule("*/5 * * * *", () => {
  checkUpcomingSessions();
});

console.log("Session Reminder Job Started");
