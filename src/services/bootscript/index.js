import User from '../../api/user/model'

export const createBootAdmin = async () => {
  try {
    const admin = await User.findOne({ email: 'maxprudnik@gmail.com' })
    if (admin) {
      console.log('Boot admin already exist!')
      return
    }
    await User.create({
      email: 'maxprudnik@gmail.com',
      password: 'Max123',
      username: 'mprudnik'
    })
  } catch (error) {
    console.error(error)
  }
}
