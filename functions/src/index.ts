import * as v2 from 'firebase-functions/v2'


import * as admin from 'firebase-admin'
admin.initializeApp()



interface IFirebaseEscola{
    nome: string,
    id: string
}

interface IFirebasePesagem{
    escolaID: string,
    pesagem: {
        metal: number
        papel: number
        plastico: number
        vidro: number
    }
    id: string
    dataRegistro: Date
}

// interface IFirebaseTurma{
//     nome: string
//     id: string
//     escolaID: string
// }


// interface ISchool {
//     school: {
//         id: string
//         name: string
//     }
//     classes: {
//         id: string,
//         name: string
//     }[]
// }

interface ITotal {
    paper: number,
    metal: number,
    glass: number,
    plastic: number,
    total: number
}

interface ISchoolWithTotalRecycled {
    school: {
        id: string
        name: string
    }
    total: ITotal
}



export const getRecycledGarbagePerSchool = v2.https.onRequest(async (request, response)=>{
    try {
        const snapshot = await admin.firestore().collection('escola').get();
        const rawSchoolObject: IFirebaseEscola[] = snapshot.docs.map(doc => doc.data() as IFirebaseEscola );

        const completedData: ISchoolWithTotalRecycled[] = await Promise.all(rawSchoolObject.map( async (school)=>{
            const snapshot = await admin.firestore()
                .collection('pesagem')
                .where('escolaID','==', school.id).get()

            const weighings: IFirebasePesagem[] = snapshot.docs.map(doc => doc.data() as IFirebasePesagem );

            const total: ITotal = weighings.reduce((acc, record )=>{
                const total = record.pesagem.papel
                            + record.pesagem.metal
                            + record.pesagem.vidro
                            + record.pesagem.plastico + acc.total
                return {
                    paper: acc.paper + record.pesagem.papel,
                    metal: acc.metal + record.pesagem.metal,
                    glass: acc.glass + record.pesagem.vidro,
                    plastic: acc.plastic + record.pesagem.plastico,
                    total
                }
            },  {
                paper: 0,
                metal: 0,
                glass: 0,
                plastic: 0,
                total: 0
            })

            return {
                school: {
                    name: school.nome,
                    id: school.id
                },
                total: {
                    paper: total.paper / 1000,
                    metal: total.metal / 1000,
                    plastic: total.plastic / 1000,
                    glass: total.glass / 1000,
                    total: total.total / 1000
                }
            }
        }))

        response.send({
            completedData,
        });
    } catch (error) {
        console.error('Erro ao buscar dados do Firestore:', error);
        response.status(500).send('Erro ao buscar dados do Firestore');
    }
})








// const schools: ISchool[] = await Promise.all(rawSchoolObject.map(async (school)=>{
//     const snapshot = await admin.firestore().collection('turma').where('escolaID','==', school.id).get();
//     const classes: IFirebaseTurma[] = snapshot.docs.map(doc => doc.data() as IFirebaseTurma );
//
//     debugger
//
//     return {
//         school: {
//             id: school.id,
//             name: school.nome
//         },
//         classes: classes.map((singleClass)=>{
//             return {
//                 name: singleClass.nome,
//                 id: singleClass.id
//             }
//         })
//     } as ISchool
// }))