import sequelize from './db'
import { User } from './models/user'

sequelize.addModels([User])

export { User }
export default sequelize
