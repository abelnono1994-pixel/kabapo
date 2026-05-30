export type Testimonial = {
    id: string;
    name: string;
    eventType: string;
    comment: string;
    rating: number;
    avatarImageId: string;
}

export const testimonials: Testimonial[] = [
    {
        id: '1',
        name: 'Marie & Jean',
        eventType: 'Mariage',
        comment: "Un service exceptionnel ! L'équipe a su capturer chaque moment magique de notre journée. Professionnalisme et discrétion au rendez-vous.",
        rating: 5,
        avatarImageId: 'avatar-1'
    },
    {
        id: '2',
        name: 'Paul D.',
        eventType: 'Fête d\'entreprise',
        comment: "La logistique et la sonorisation étaient parfaites. Tout s'est déroulé sans accroc. Je recommande vivement Inoubliable pour les événements professionnels.",
        rating: 5,
        avatarImageId: 'avatar-2'
    },
    {
        id: '3',
        name: 'Sophie L.',
        eventType: 'Anniversaire',
        comment: "Le gâteau était aussi beau que bon, et le photographe a fait un travail fantastique. Merci d'avoir rendu cet anniversaire si spécial !",
        rating: 4,
        avatarImageId: 'avatar-3'
    },
     {
        id: '4',
        name: 'Famille Durand',
        eventType: 'Baptême',
        comment: "Grâce à vous, nous avons pu profiter pleinement de cette journée en famille. Le traiteur était délicieux et le service impeccable.",
        rating: 5,
        avatarImageId: 'avatar-1'
    },
    {
        id: '5',
        name: 'Startup Connect',
        eventType: 'Fête d\'entreprise',
        comment: "Organisation parfaite. Le service de boissons et la musique ont vraiment mis l'ambiance. Nos collaborateurs étaient ravis.",
        rating: 5,
        avatarImageId: 'avatar-2'
    }
];
