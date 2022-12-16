import { Injectable, Logger } from '@nestjs/common';
import { WakaTimeClient } from 'wakatime-client';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';
import axios from 'axios';

type timeStats = {
    hours: Number;
    minutes: Number;
    string: String;
}

type repoStats = {
    repoCount: Number;
    languages: Object;
}


type stats = {
    time: timeStats;
    repos: repoStats;
}


@Injectable()
export class AppService {

    private wakaClient: WakaTimeClient;
    private stats
    // private readonly logger = new Logger(AppService.name);

    constructor(private configSvc: ConfigService) {
        const key = this.configSvc.get("WAKATIME_API_KEY");
        if (!key) throw new Error(`WAKATIME_API_KEY variable missing`);
        this.wakaClient = new WakaTimeClient(key);

        this.RefreshStats()

        setInterval(async () => { await this.RefreshStats() }, 900000)
    }

    public async GetTime(): Promise<timeStats> {

        const data = await this.wakaClient.getMySummary({
            dateRange: {
                startDate: dayjs().subtract(6, "day").format("YYYY-MM-DD"),
                endDate: dayjs().format("YYYY-MM-DD"),
            },
        })

        let totalHoursThisWeek = 0
        for (let day of data.data) {
            totalHoursThisWeek += parseFloat(day.grand_total.decimal)
        }

        const hours = Math.floor(totalHoursThisWeek);
        const minutes = Math.floor((totalHoursThisWeek - hours) * 60);

        return {
            hours,
            minutes,
            string: `${hours}:${minutes.toLocaleString(undefined, { minimumIntegerDigits: 2 })}`,
        };
    }

    public async GetRepoData(): Promise<repoStats> {
        let url = "https://api.github.com/users/nasserkessas/repos";

        const token = this.configSvc.get("GITHUB_ACCESS_TOKEN");
        if (!token) throw new Error(`GITHUB_ACCESS_TOKEN variable missing`);

        const res = await axios.get(url, {
            auth: {
                username: 'nasserkessas',
                password: token
            }
        });

        let languages = {}
        for (let repo of res.data) {

            if (repo.language == null) {
                continue
            }

            if (repo.fork) {
                continue
            }

            let langsRes = await axios.get(repo.languages_url, {
                auth: {
                    username: 'nasserkessas',
                    password: token
                }
            });
            for (let lang of Object.keys(langsRes.data)) {
                if (!languages[lang]) {
                    languages[lang] = langsRes.data[lang]
                } else {
                    languages[lang] += langsRes.data[lang]
                }
            }
        }

        let total = 0;

        for (let lang of Object.keys(languages)) {
            total += languages[lang];
        }

        for (let lang of Object.keys(languages)) {
            languages[lang] = languages[lang] / total * 100;
        }

        return {
            repoCount: res.data.length,
            languages
        }
    }

    public async RefreshStats() {
        let time = await this.GetTime();
        let repos = await this.GetRepoData();
        this.stats = {
            time,
            repos
        }
    }

    public RetrieveStats(): stats {
        return this.stats;
    }
}
