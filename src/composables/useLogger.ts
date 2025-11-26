import {useStorage} from "@vueuse/core";

export function useLogger() {
    const logger = useStorage(
        'logger',
        '-',
        localStorage,
        {
            mergeDefaults: true,
        },
    )

    return {
        debug: (msg: string) => {
            if (logger.value !== 'debug') {
                return
            }
            console.debug(new Date().toISOString(), 'debug', msg)
        }
    }
}