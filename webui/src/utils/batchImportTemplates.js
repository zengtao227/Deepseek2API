import exampleConfig from '../../../config.example.json'

export function getBatchImportTemplates(t) {
    return {
        full: {
            name: t('batchImport.templates.full.name'),
            desc: t('batchImport.templates.full.desc'),
            config: exampleConfig,
        },
        email_only: {
            name: t('batchImport.templates.emailOnly.name'),
            desc: t('batchImport.templates.emailOnly.desc'),
            config: {
                keys: ['your-api-key'],
                accounts: [
                    { email: 'account1@example.com', password: 'pass1', token: '' },
                    { email: 'account2@example.com', password: 'pass2', token: '' },
                    { email: 'account3@example.com', password: 'pass3', token: '' },
                ],
            },
        },
        mobile_only: {
            name: t('batchImport.templates.mobileOnly.name'),
            desc: t('batchImport.templates.mobileOnly.desc'),
            config: {
                keys: ['your-api-key'],
                accounts: [
                    { mobile: '+8613800000001', password: 'pass1', token: '' },
                    { mobile: '+8613800000002', password: 'pass2', token: '' },
                    { mobile: '+8613800000003', password: 'pass3', token: '' },
                ],
            },
        },
        keys_only: {
            name: t('batchImport.templates.keysOnly.name'),
            desc: t('batchImport.templates.keysOnly.desc'),
            config: {
                keys: ['key-1', 'key-2', 'key-3'],
            },
        },
    }
}
