import bcrypt from 'bcrypt';
import db from '../models/index.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { addVietnamTimeFields } from '../utils/timezone.utils.js';
import { Op } from 'sequelize';
import admin from 'firebase-admin';
import { detectDeviceType, formatDeviceInfo } from '../utils/deviceDetector.js';

// Khởi tạo Firebase Admin SDK nếu chưa được khởi tạo
// Đảm bảo rằng bạn đã cấu hình biến môi trường FIREBASE_SERVICE_ACCOUNT_KEY
// hoặc cung cấp đường dẫn đến file service account JSON.
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error("Lỗi khi khởi tạo Firebase Admin SDK:", error);
  }
}

const { User, Role, RefreshToken, LoginHistory } = db;

const registerUser = async (username, email, password, phoneNumber, req = null) => {
  const existingUser = await User.findOne({
    where: { email }
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error('Email đã được sử dụng.');
    }
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    phoneNumber,
  });

  const defaultRole = await Role.findOne({ where: { name: 'user' } });
  if (defaultRole) {
    await user.addRole(defaultRole);
  } else {
    console.warn('Default role "user" not found. Please seed the database.');
  }

  const userWithRoles = await User.findByPk(user.id, {
    include: [{ model: Role, as: 'roles', attributes: ['name'] }],
    attributes: { exclude: ['password', 'updatedAt', 'deletedAt', 'provider'] }
  });

  const userWithVNTime = addVietnamTimeFields(userWithRoles, ['createdAt', 'lastOnline']);

  const accessToken = generateAccessToken(userWithRoles);
  const refreshToken = generateRefreshToken(userWithRoles);

  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,
    expiryDate: new Date(Date.now() + parseInt(process.env.REFRESH_EXPIRES_MS)),
  });

  // Ghi log lịch sử đăng nhập
  if (req) {
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    const deviceType = detectDeviceType(userAgent);

    await LoginHistory.create({
      userId: user.id,
      provider: 'local',
      ipAddress: ipAddress,
      userAgent: userAgent,
      deviceType: deviceType,
    });
  }

  return { user: userWithVNTime, accessToken, refreshToken };
};

const loginUser = async (email, password, req = null) => {
  const user = await User.findOne({
    where: { email }
  });

  if (!user) {
    throw new Error('Email hoặc mật khẩu không đúng.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Email hoặc mật khẩu không đúng.');
  }

  const userWithRoles = await User.findByPk(user.id, {
    include: [{ model: Role, as: 'roles', attributes: ['name'] }],
    attributes: { exclude: ['password', 'updatedAt', 'deletedAt', 'provider'] }
  });

  const userWithVNTime = addVietnamTimeFields(userWithRoles, ['createdAt', 'lastOnline']);

  const accessToken = generateAccessToken(userWithRoles);
  const refreshToken = generateRefreshToken(userWithRoles);

  await RefreshToken.destroy({ where: { userId: user.id } });
  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,
    expiryDate: new Date(Date.now() + parseInt(process.env.REFRESH_EXPIRES_MS)),
  });

  // Ghi log lịch sử đăng nhập
  if (req) {
    const ipAddress = req.ip || req.connection?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    const deviceType = detectDeviceType(userAgent);

    await LoginHistory.create({
      userId: user.id,
      provider: 'local',
      ipAddress: ipAddress,
      userAgent: userAgent,
      deviceType: deviceType,
    });
  }

  return { user: userWithVNTime, accessToken, refreshToken };
};

const refreshUserToken = async (oldRefreshToken) => {
  const existingRefreshToken = await RefreshToken.findOne({
    where: { token: oldRefreshToken },
    include: [{ model: User, as: 'user', include: [{ model: Role, as: 'roles', attributes: ['name'] }] }],
  });

  if (!existingRefreshToken || existingRefreshToken.expiryDate < new Date()) {
    throw new Error('Refresh token không hợp lệ hoặc đã hết hạn.');
  }

  const user = existingRefreshToken.user;
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  existingRefreshToken.token = newRefreshToken;
  existingRefreshToken.expiryDate = new Date(Date.now() + parseInt(process.env.REFRESH_EXPIRES_MS));
  await existingRefreshToken.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logoutUser = async (refreshToken, userId = null) => {
  await RefreshToken.destroy({ where: { token: refreshToken } });
  
  // Cập nhật logoutAt cho lịch sử đăng nhập gần nhất
  if (userId) {
    const latestLogin = await LoginHistory.findOne({
      where: { userId: userId, logoutAt: null },
      order: [['loginAt', 'DESC']],
    });
    
    if (latestLogin) {
      latestLogin.logoutAt = new Date();
      await latestLogin.save();
    }
  }
};

const socialLogin = async (idToken, provider, req) => {
  // 1. Validate input
  if (!idToken || !provider) {
    throw new Error('Thiếu thông tin idToken hoặc provider.');
  }

  // Danh sách các provider được hỗ trợ
  const supportedProviders = ['google', 'facebook', 'github'];
  if (!supportedProviders.includes(provider.toLowerCase())) {
    throw new Error(`Provider "${provider}" không được hỗ trợ. Chỉ hỗ trợ: ${supportedProviders.join(', ')}`);
  }

  let decodedToken;
  try {
    // 2. Xác thực idToken từ Firebase
    decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log(`✅ Firebase token verified for provider: ${provider}`, {
      uid: decodedToken.uid,
      email: decodedToken.email,
    });
  } catch (error) {
    console.error('❌ Lỗi xác thực Firebase ID Token:', error);
    
    // Xử lý các loại lỗi Firebase cụ thể
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
    } else if (error.code === 'auth/invalid-id-token') {
      throw new Error('Token không hợp lệ.');
    } else if (error.code === 'auth/id-token-revoked') {
      throw new Error('Token đã bị thu hồi. Vui lòng đăng nhập lại.');
    }
    
    throw new Error('ID Token không hợp lệ hoặc đã hết hạn.');
  }

  // 3. Chống Replay Attack: Kiểm tra thời gian xác thực của token
  // `auth_time` là thời điểm người dùng được xác thực bởi Firebase.
  // Nếu `auth_time` quá cũ, có thể là một cuộc tấn công replay.
  const REPLAY_ATTACK_THRESHOLD_SECONDS = 300; // 5 phút
  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  if (decodedToken.auth_time && decodedToken.auth_time < (currentTimeInSeconds - REPLAY_ATTACK_THRESHOLD_SECONDS)) {
    console.warn('⚠️ Potential replay attack detected:', {
      auth_time: decodedToken.auth_time,
      current_time: currentTimeInSeconds,
      diff: currentTimeInSeconds - decodedToken.auth_time,
    });
    throw new Error('Token quá cũ, có thể là một cuộc tấn công replay.');
  }

  const { email, uid, name, picture } = decodedToken;

  // Validate email
  if (!email) {
    throw new Error('Email không tồn tại trong token. Vui lòng sử dụng tài khoản có email.');
  }

  // Tìm kiếm người dùng trong hệ thống
  let user = await User.findOne({
    where: {
      [Op.or]: [
        { email: email },
        { uuid: uid, provider: provider.toLowerCase() }
      ]
    }
  });

  let isNewUser = false;
  
  if (!user) {
    // Nếu người dùng chưa tồn tại, tạo tài khoản mới
    isNewUser = true;
    console.log(`📝 Creating new user via ${provider}:`, { email, uid });
    
    const defaultRole = await Role.findOne({ where: { name: 'user' } });
    if (!defaultRole) {
      console.error('❌ Default role "user" not found. Please seed the database.');
      throw new Error('Hệ thống chưa cấu hình vai trò mặc định.');
    }

    // Transaction để đảm bảo tính nhất quán
    user = await db.sequelize.transaction(async (t) => {
      const newUser = await User.create({
        uuid: uid,
        username: name || email.split('@')[0],
        email: email,
        password: bcrypt.hashSync(uid + process.env.JWT_SECRET, 10), // Hash UUID với secret để tạo password
        avatarUrl: picture,
        provider: provider.toLowerCase(),
      }, { transaction: t });
      
      await newUser.addRole(defaultRole, { transaction: t });
      
      console.log(`✅ New user created successfully: ${newUser.id}`);
      return newUser;
    });
  } else {
    // Nếu người dùng đã tồn tại, cập nhật thông tin nếu cần
    console.log(`🔄 Existing user found: ${user.id}`, { email, provider });
    
    const updateFields = {};
    
    // Cập nhật thông tin từ provider nếu có thay đổi
    if (name && user.username !== name && user.provider === provider.toLowerCase()) {
      updateFields.username = name;
    }
    if (picture && user.avatarUrl !== picture && user.provider === provider.toLowerCase()) {
      updateFields.avatarUrl = picture;
    }
    if (!user.provider || user.provider === 'local') {
      // Nếu user được tạo bằng email/password, cập nhật provider
      updateFields.provider = provider.toLowerCase();
      updateFields.uuid = uid;
    }
    if (!user.uuid && user.provider === provider.toLowerCase()) {
      updateFields.uuid = uid;
    }

    if (Object.keys(updateFields).length > 0) {
      await user.update(updateFields);
      console.log(`✅ User updated:`, updateFields);
    }
  }

  // Lấy thông tin người dùng kèm vai trò để tạo token
  const userWithRoles = await User.findByPk(user.id, {
    include: [{ model: Role, as: 'roles', attributes: ['name'] }],
    attributes: { exclude: ['password', 'updatedAt', 'deletedAt'] }
  });

  const userWithVNTime = addVietnamTimeFields(userWithRoles, ['createdAt', 'lastOnline']);

  const accessToken = generateAccessToken(userWithRoles);
  const refreshToken = generateRefreshToken(userWithRoles);

  await RefreshToken.destroy({ where: { userId: user.id } });

  await RefreshToken.create({
    token: refreshToken,
    userId: user.id,
    expiryDate: new Date(Date.now() + parseInt(process.env.REFRESH_EXPIRES_MS)),
  });

  // Ghi log lịch sử đăng nhập
  const ipAddress = req ? (req.ip || req.connection?.remoteAddress) : null;
  const userAgent = req ? req.headers['user-agent'] : null;
  const deviceType = detectDeviceType(userAgent);

  await LoginHistory.create({
    userId: user.id,
    provider: provider.toLowerCase(),
    ipAddress: ipAddress,
    userAgent: userAgent,
    deviceType: deviceType,
  });

  return { user: userWithVNTime, accessToken, refreshToken, isNewUser };
};

export { registerUser, loginUser, refreshUserToken, logoutUser, socialLogin };
