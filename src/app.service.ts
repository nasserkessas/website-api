import { Injectable } from '@nestjs/common';
import { WakaTimeClient } from 'wakatime-client';
import * as dotenv from 'dotenv';
dotenv.config()


@Injectable()
export class AppService {

    constructor() { }

    async getHello() {
        try {
            const client = new WakaTimeClient(process.env.WAKATIME_API_KEY);
            const data = await client.getMySummary({
                dateRange: {
                    startDate: '2022-12-09',
                    endDate: '2022-12-15',
                },
            })

            let totalHoursThisWeek = 0
            for (let day of data.data) {
                totalHoursThisWeek += parseFloat(day.grand_total.decimal)
            }
            return {"hours": Math.floor(totalHoursThisWeek), "minutes": (Math.round((totalHoursThisWeek-Math.floor(totalHoursThisWeek))*60)), string: `${Math.floor(totalHoursThisWeek)}:${(Math.round((totalHoursThisWeek-Math.floor(totalHoursThisWeek))*60)).toLocaleString(undefined, {minimumIntegerDigits: 2})}`};
        }
        catch (e) {
            console.log(`ERROR: ${e.message}`)
        }
    }
}
