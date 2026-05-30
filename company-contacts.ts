
export type CompanyContact = {
    id: string;
    name: string; // Translation key or literal
    role: string; // Translation key
    email?: string;
    phone?: string;
    avatarId: string;
    type: 'management' | 'service' | 'support';
    icon?: string;
}

export const companyContacts: CompanyContact[] = [
    {
        id: 'ceo',
        name: 'Abel Ngansop',
        role: 'footer.role_ceo',
        avatarId: 'contact-ceo',
        type: 'management'
    },
    {
        id: 'hr',
        name: 'Ivan Nono',
        role: 'footer.role_director',
        avatarId: 'contact-hr',
        type: 'management'
    },
    {
        id: 'service-photo',
        name: 'footer.service_photo',
        role: 'footer.role_manager',
        email: 'photo@kabapo.com',
        avatarId: 'avatar-1',
        type: 'service',
        icon: 'Camera'
    },
    {
        id: 'service-video',
        name: 'footer.service_video',
        role: 'footer.role_manager',
        email: 'video@kabapo.com',
        avatarId: 'avatar-2',
        type: 'service',
        icon: 'Video'
    },
     {
        id: 'service-event',
        name: 'footer.service_event',
        role: 'footer.role_manager',
        email: 'event@kabapo.com',
        avatarId: 'avatar-3',
        type: 'service',
        icon: 'PartyPopper'
    },
    {
        id: 'emergency_complaints',
        name: 'footer.emergency_complaints',
        role: 'footer.role_support',
        email: 'contact@kabapo.com',
        phone: '+237 699 264 201',
        avatarId: 'none',
        type: 'support'
    }
]
