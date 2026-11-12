import com.bookstore.util.PasswordUtil;
import com.bookstore.model.user.User;
import com.bookstore.model.admin.Admin;
import java.util.UUID;

public class PasswordVerificationCheck {
    private static void check(boolean value) { if (!value) throw new AssertionError("Password verification regression"); }
    public static void main(String[] args) {
        String password = UUID.randomUUID().toString();
        String first = PasswordUtil.hashForStorage(password.toCharArray());
        String second = PasswordUtil.hashForStorage(password.toCharArray());
        check(!first.equals(second));
        check(PasswordUtil.verifyStoredPassword(password, first));
        check(!PasswordUtil.verifyStoredPassword(password + "x", first));
        check(!PasswordUtil.verifyStoredPassword(null, first));
        check(!PasswordUtil.verifyStoredPassword(password, "pbkdf2-sha256$invalid"));
        check(!PasswordUtil.verifyStoredPassword(password, "pbkdf2-sha256$999999999$x$y"));
        User user = new User(); user.setPassword(first);
        Admin admin = new Admin(); admin.setPassword(first);
        check(user.authenticate(password) && admin.authenticate(password));
        check(!user.authenticate(password + "x") && !admin.authenticate(password + "x"));
        check(user.getPassword().equals(first) && admin.getPassword().equals(first));
        user.setPassword(password); admin.setPassword(password);
        check(user.authenticate(password) && admin.authenticate(password));
        check(user.getPassword().equals(password) && admin.getPassword().equals(password));
        System.out.println("PASS: random salts, correct/wrong/null/malformed hashes, bounded iterations, both models, unchanged legacy passwords");
    }
}
