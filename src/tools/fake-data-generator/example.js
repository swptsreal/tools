export const fakeDataDefaults = {
    fields: [
        { label: 'id', type: 'uuid' },
        { label: 'name', type: 'fullName' },
        { label: 'email', type: 'email' },
        { label: 'active', type: 'boolean' }
    ],
    count: 5
}

export const FIELD_TYPES = [
    { label: 'Text', value: 'text' },
    { label: 'UUID', value: 'uuid' },
    { label: 'First Name', value: 'firstName' },
    { label: 'Last Name', value: 'lastName' },
    { label: 'Full Name', value: 'fullName' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Date', value: 'date' },
    { label: 'Company', value: 'company' },
    { label: 'Street Address', value: 'streetAddress' },
    { label: 'City', value: 'city' },
    { label: 'Country', value: 'country' },
    { label: 'Zip Code', value: 'zipCode' }
]
