export default class UUID {
    static generateUUID(): string {
        const hexDigits = '0123456789abcdef'
        const s: string[] = Array(36).fill('')

        for (let i = 0; i < 36; i++) {
            s[i] = hexDigits.charAt(Math.floor(Math.random() * 0x10))
        }
        s[14] = '4'
        s[19] = hexDigits.charAt((parseInt(s[19], 16) & 0x3) | 0x8)
        s[8] = s[13] = s[18] = s[23] = '-'

        return s.join('')
    }
}